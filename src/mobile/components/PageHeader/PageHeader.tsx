// @islet-import-scope same-dir

import { localize } from '@/nls';
import { Header } from '@/mobile/test.id';
import { cx, styles, zIndex } from '@/mobile/styles/ui';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import { ChevronLeft } from 'lucide-react';
import React from 'react';
import { useService } from '@/hooks/use-service';
import { useLocation } from 'react-router';
import { getBackFallbackPath } from '@/mobile/route';
import { PageHeaderLeftContent } from './PageHeaderLeftContent';
import { PageHeaderRightContent } from './PageHeaderRightContent';
import type { PageHeaderProps } from './PageHeader.types';

export type { PageHeaderIconItem, PageHeaderRight, PageHeaderRightItem } from './PageHeader.types';

export function PageHeader({ title = '', showBack, left, right, tone = 'nav' }: PageHeaderProps) {
  const navigationService = useService(INavigationService);
  const location = useLocation();
  const fallbackPath = getBackFallbackPath(location.pathname, location.search);
  return (
    <header
      className={cx(
        styles.Header.Root,
        tone === 'surface' ? styles.PageHeader.ToneSurface : styles.PageHeader.ToneNav,
      )}
      data-test-id={Header.root}
      style={{ zIndex: zIndex.pageHeader }}
    >
      <div className={styles.PageHeader.Left} data-test-id={Header.left}>
        <PageHeaderLeftContent left={left} />
        {showBack && (
          <button
            className={styles.Button.Icon}
            type='button'
            data-test-id={Header.back}
            title={localize('common.back', 'Back')}
            aria-label={localize('common.back', 'Back')}
            onClick={() => navigationService.goBack({ fallbackPath })}
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
        )}
      </div>
      <div className={styles.Header.Title} data-test-id={Header.title}>
        {title}
      </div>
      <div className={styles.PageHeader.Right} data-test-id={Header.right}>
        <PageHeaderRightContent right={right} />
      </div>
    </header>
  );
}
