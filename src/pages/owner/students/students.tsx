import React, { FC, useMemo } from 'react';

import { Flex as ChakraFlex } from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from 'react-query';

import { StudentsPanelFilters, StudentsPanelListing } from 'components/Pages/Owner/OwnerStudentsPanel';

import { useFirebaseContext } from 'lib/firebase';
import { UserDetails, UserDetailsWithId } from 'types';

export const OwnerStudentsPanel: FC = () => {
  const { firestore } = useFirebaseContext();
  const form = useFormContext();

  const values = form.watch();

  const studentsQuery = useQuery(
    ['owner', 'students', values.difficultLevel, values.testType, values.whereDidYouHearAboutUs],
    async () => {
      const { difficultLevel, testType, whereDidYouHearAboutUs } = values;

      if (difficultLevel || testType || whereDidYouHearAboutUs) {
        const queryKey = difficultLevel ? 'difficultLevel' : testType ? 'testType' : 'whereDidYouHearAboutUs';
        const queryValue = difficultLevel || testType || whereDidYouHearAboutUs;

        const usersSnap = await firestore
          .collection('users')
          .where(queryKey, '==', queryValue)
          .orderBy('firstName')
          .withConverter<UserDetailsWithId>({
            fromFirestore: (doc) => {
              return {
                id: doc.id,
                ...(doc.data() as UserDetails)
              };
            },
            toFirestore: (doc: UserDetails) => doc
          })
          .get();

        const students = usersSnap.docs.map((doc) => doc.data());

        return students;
      }

      const usersSnap = await firestore
        .collection('users')
        .orderBy('firstName')
        .withConverter<UserDetailsWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as UserDetails)
            };
          },
          toFirestore: (doc: UserDetails) => doc
        })
        .get();

      const students = usersSnap.docs.map((doc) => doc.data());

      return students;
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const getFilteredStudents = useMemo(() => {
    const filteredStudentsBySearch = studentsQuery?.data?.filter(
      (student) =>
        student.firstName.toLocaleLowerCase().match(values?.searchStudents?.toLocaleLowerCase()) ||
        student.lastName.toLocaleLowerCase().match(values?.searchStudents?.toLocaleLowerCase())
    );
    return filteredStudentsBySearch ?? [];
  }, [studentsQuery.data, values.searchStudents]);

  return (
    <ChakraFlex flexDirection="column">
      <ChakraFlex width="100%" flexDirection="column" marginBottom="lg">
        <StudentsPanelFilters students={getFilteredStudents} />
      </ChakraFlex>
      <StudentsPanelListing isLoading={studentsQuery.isLoading} students={getFilteredStudents} />
    </ChakraFlex>
  );
};
