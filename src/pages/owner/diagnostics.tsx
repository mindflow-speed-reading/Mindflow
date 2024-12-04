import React, { FC, useMemo, useState } from 'react';

import {
  Flex as ChakraFlex,
  Input as ChakraInput,
  InputGroup as ChakraInputGroup,
  InputRightElement as ChakraInputRightElement,
  useDisclosure
} from '@chakra-ui/react';
import { useQuery } from 'react-query';

import { Icon } from 'components/common';

import { useFirebaseContext } from 'lib/firebase';

import { Diagnostic, DiagnosticDocumentWithId } from 'types';

import { DiagnosticsPanelListing, DiagnosticsPanelModal } from 'components/Pages/Owner/OwnerDiagnosticsPanel';

export const OwnerDiagnosticsPanel: FC = () => {
  const modalDisclosure = useDisclosure();

  const [searchInput, setSearchInput] = useState('');
  const [editedDiagnostic, setEditedDiagnostic] = useState<DiagnosticDocumentWithId>();

  const { firestore } = useFirebaseContext();

  const diagnosticsQuery = useQuery(['query:diagnostics'], async () => {
    const diagnosticsSnap = await firestore
      .collection('diagnostics')
      .orderBy('category', 'asc')
      .orderBy('order', 'asc')
      .withConverter<Diagnostic>({
        fromFirestore: (doc) => ({ id: doc.id, ...(doc.data() as Diagnostic) }),
        toFirestore: (doc: Diagnostic) => doc
      })
      .limit(200)
      .get();

    const diagnostics = diagnosticsSnap.docs.map((d) => d.data());

    return diagnostics;
  });

  const getFilteredDiagnostics = useMemo(
    () =>
      diagnosticsQuery.data?.filter(
        (diagnostic) =>
          diagnostic?.name?.toLocaleLowerCase().match(searchInput.toLowerCase()) ||
          diagnostic?.category?.toLowerCase().match(searchInput.toLowerCase()) ||
          diagnostic?.author?.toLowerCase().match(searchInput.toLowerCase())
      ) ?? [],
    [diagnosticsQuery.data, searchInput]
  );

  const handleModalClose = () => {
    setEditedDiagnostic(undefined);
    diagnosticsQuery.refetch();
    modalDisclosure.onClose();
  };

  const handleEditModal = (diagnostic: DiagnosticDocumentWithId) => {
    setEditedDiagnostic(diagnostic);
    modalDisclosure.onOpen();
  };

  return (
    <ChakraFlex flexDirection="column">
      <ChakraFlex marginBottom="md" justifyContent="space-between" alignItems="center">
        <ChakraInputGroup width="340px">
          <ChakraInput
            placeholder="Search Diagnostics"
            borderRadius="sm"
            value={searchInput}
            onChange={({ target }) => setSearchInput(target.value)}
          />
          <ChakraInputRightElement>
            <Icon size="sm" borderColor="gray.500" name="search" />
          </ChakraInputRightElement>
        </ChakraInputGroup>
      </ChakraFlex>
      {modalDisclosure.isOpen && (
        <DiagnosticsPanelModal
          isOpen={modalDisclosure.isOpen}
          editedDiagnostic={editedDiagnostic}
          onClose={() => handleModalClose()}
        />
      )}
      <DiagnosticsPanelListing
        data={getFilteredDiagnostics}
        isLoading={diagnosticsQuery.isLoading}
        onEdit={(diagnostic) => handleEditModal(diagnostic)}
      />
    </ChakraFlex>
  );
};
