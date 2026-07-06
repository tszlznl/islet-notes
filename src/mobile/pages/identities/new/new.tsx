import { useService } from '@/hooks/use-service';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { TextInputRow } from '@/mobile/components/TextInputRow';
import { IdentityCreate } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';

export function IdentitiesNewPage() {
  const diaryService = useService(IDiaryService);
  const navigationService = useService(INavigationService);
  const [name, setName] = useState('');
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    diaryService.addIdentity(name.trim());
    navigationService.navigate({ path: '/identities', replace: true });
  };

  return (
    <HeaderPage
      pageTestId={IdentityCreate.page}
      contentTestId={IdentityCreate.content}
      header={{
        title: localize('identity.create', 'New identity'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          disabled: !canSave,
          testId: IdentityCreate.save,
          onClick: save,
        },
      }}
    >
      <TextInputRow
        id='identityName'
        testId={IdentityCreate.nameInput}
        autoFocus
        placeholder={localize('identity.namePlaceholder', 'Enter a nickname')}
        value={name}
        onChange={setName}
      />
    </HeaderPage>
  );
}
