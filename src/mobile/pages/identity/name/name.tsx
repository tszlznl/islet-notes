import { getIdentityById } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { HeaderPage } from '@/mobile/components/layout/HeaderPage';
import { TextInputRow } from '@/mobile/components/TextInputRow';
import { useDiaryModel } from '@/mobile/hooks/useDiaryModel';
import { IdentityName } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { INavigationService } from '@/services/navigationService/common/navigationService';
import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router';

export function IdentityNamePage() {
  const { identityId } = useParams();
  const navigationService = useService(INavigationService);
  const diaryService = useService(IDiaryService);
  const model = useDiaryModel();
  const identity = identityId ? getIdentityById(model, identityId) : undefined;
  const [name, setName] = useState(identity?.name ?? '');
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  if (!identity || !identityId) return <Navigate to='/identities' replace />;

  const save = () => {
    diaryService.updateIdentityName(identityId, trimmedName);
    navigationService.goBack({ fallbackPath: `/identity/${identityId}` });
  };

  return (
    <HeaderPage
      pageTestId={IdentityName.page}
      contentTestId={IdentityName.content}
      header={{
        title: localize('identity.name', 'Nickname'),
        showBack: true,
        right: {
          type: 'button',
          label: localize('common.save', 'Save'),
          disabled: !canSave,
          testId: IdentityName.save,
          onClick: save,
        },
      }}
    >
      <TextInputRow
        id='identityName'
        testId={IdentityName.nameInput}
        autoFocus
        placeholder={localize('identity.namePlaceholder', 'Enter a nickname')}
        value={name}
        onChange={setName}
      />
    </HeaderPage>
  );
}
