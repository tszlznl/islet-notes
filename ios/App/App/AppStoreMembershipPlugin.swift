import Capacitor
import Foundation
import StoreKit

@objc(AppStoreMembershipPlugin)
class AppStoreMembershipPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "AppStoreMembershipPlugin"
    let jsName = "AppStoreMembership"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise)
    ]

    @objc func getProduct(_ call: CAPPluginCall) {
        guard let productID = call.getString("productId"), !productID.isEmpty else {
            call.reject("Product ID is required", "INVALID_PRODUCT_ID")
            return
        }

        Task {
            do {
                let product = try await loadProduct(productID)
                call.resolve([
                    "productId": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "displayPrice": product.displayPrice
                ])
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard AppStore.canMakePayments else {
            call.reject("App Store purchases are not allowed on this device", "PAYMENTS_NOT_ALLOWED")
            return
        }
        guard let productID = call.getString("productId"), !productID.isEmpty else {
            call.reject("Product ID is required", "INVALID_PRODUCT_ID")
            return
        }
        guard
            let tokenValue = call.getString("appAccountToken"),
            let appAccountToken = UUID(uuidString: tokenValue)
        else {
            call.reject("App account token must be a UUID", "INVALID_ACCOUNT_TOKEN")
            return
        }

        Task { @MainActor in
            do {
                let product = try await loadProduct(productID)
                let result = try await product.purchase(options: [.appAccountToken(appAccountToken)])
                switch result {
                case .success(let verification):
                    resolveVerifiedTransaction(
                        call,
                        verification: verification,
                        status: "purchased"
                    )
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.reject("Unknown App Store purchase result", "APP_STORE_ERROR")
                }
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard let productID = call.getString("productId"), !productID.isEmpty else {
            call.reject("Product ID is required", "INVALID_PRODUCT_ID")
            return
        }

        Task {
            do {
                // 仅在用户明确点击“恢复购买”时触发同步，系统可能要求重新登录 Apple 账户。
                try await AppStore.sync()
                for await verification in Transaction.currentEntitlements {
                    switch verification {
                    case .verified(let transaction) where transaction.productID == productID:
                        resolveVerifiedTransaction(
                            call,
                            verification: verification,
                            status: "restored"
                        )
                        return
                    case .unverified(let transaction, _) where transaction.productID == productID:
                        call.reject("The App Store transaction could not be verified", "TRANSACTION_UNVERIFIED")
                        return
                    default:
                        continue
                    }
                }
                call.resolve(["status": "not-found"])
            } catch {
                reject(call, error: error)
            }
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let transactionID = call.getString("transactionId"), !transactionID.isEmpty else {
            call.reject("Transaction ID is required", "INVALID_TRANSACTION_ID")
            return
        }

        Task {
            for await verification in Transaction.unfinished {
                guard case .verified(let transaction) = verification else { continue }
                guard String(transaction.id) == transactionID else { continue }
                await transaction.finish()
                call.resolve()
                return
            }
            // 恢复购买返回的交易通常已完成；找不到未完成交易也视为幂等成功。
            call.resolve()
        }
    }

    private func loadProduct(_ productID: String) async throws -> Product {
        let products = try await Product.products(for: [productID])
        guard let product = products.first(where: { $0.id == productID }) else {
            throw AppStoreMembershipError.productNotFound
        }
        guard product.type == .nonConsumable else {
            throw AppStoreMembershipError.invalidProductType
        }
        return product
    }

    private func resolveVerifiedTransaction(
        _ call: CAPPluginCall,
        verification: VerificationResult<Transaction>,
        status: String
    ) {
        switch verification {
        case .verified(let transaction):
            call.resolve([
                "status": status,
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "signedTransaction": verification.jwsRepresentation
            ])
        case .unverified:
            call.reject("The App Store transaction could not be verified", "TRANSACTION_UNVERIFIED")
        }
    }

    private func reject(_ call: CAPPluginCall, error: Error) {
        if let appStoreError = error as? AppStoreMembershipError {
            call.reject(appStoreError.localizedDescription, appStoreError.code)
            return
        }
        call.reject(error.localizedDescription, "APP_STORE_ERROR", error)
    }
}

private enum AppStoreMembershipError: LocalizedError {
    case productNotFound
    case invalidProductType

    var code: String {
        switch self {
        case .productNotFound:
            return "PRODUCT_NOT_FOUND"
        case .invalidProductType:
            return "INVALID_PRODUCT_TYPE"
        }
    }

    var errorDescription: String? {
        switch self {
        case .productNotFound:
            return "The App Store product is unavailable"
        case .invalidProductType:
            return "The App Store product must be non-consumable"
        }
    }
}
