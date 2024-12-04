import moment from 'moment';
import React, { FC, useEffect, useState } from 'react';

import { auth, User } from 'firebase';
import { toast } from 'react-toastify';
import { useHistory, useRouteMatch } from 'react-router';
import { useQuery } from 'react-query';

import { TestResult, TestResultWithId, UserDetails, UserWithDetails } from 'types';

import { PageLoading } from 'components/common';

import { AuthContext } from './AuthContext';
import { useFirebaseContext } from '../index';

import { Box } from '@chakra-ui/layout';

interface Props {}

export const AuthProvider: FC<Props> = ({ children }) => {
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<User | null>(null);
  const { firestore } = useFirebaseContext();

  const { push } = useHistory();
  const isLoginPage = useRouteMatch('/login');
  const isPencilLoginPage = useRouteMatch('/pencilSpacesLogin');
  const isFreeSpeedReadPage = useRouteMatch('/free/speed-read');
  const isProgramPage = useRouteMatch('/free/program') || useRouteMatch('/free/buy-program');

  const { data: user, refetch, isLoading, isFetching, error } = useQuery<UserWithDetails | null>(
    ['user'],
    async () => {
      if (!firebaseAuthUser) return null;

      const userDetailsSnap = await firestore.collection('users').doc(firebaseAuthUser.uid).get();
      const userDetails = userDetailsSnap.data() as UserDetails;

      if (!userDetails) return null;

      if (!userDetails.lastSeen || moment().diff(moment(userDetails.lastSeen, 'x'), 'hour') > 1) {
        await firestore
          .collection('users')
          .doc(firebaseAuthUser.uid)
          .update({
            lastSeen: +new Date()
          });
      }

      const difficultLevel = userDetails?.difficultLevel;

      const testResultsQuery = await firestore
        .collection('testResults')
        .where('category', '==', difficultLevel)
        .where('user.id', '==', firebaseAuthUser?.uid)
        .limit(150)
        .withConverter<TestResultWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as TestResult)
            };
          },
          toFirestore: (doc: TestResult) => doc
        })
        .get();

      const testResults: TestResultWithId[] = testResultsQuery.docs.map((doc) => doc.data());
      return {
        ...firebaseAuthUser,
        userDetails,
        testResults
      };
    },
    {
      cacheTime: 15000,
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      enabled: !!firebaseInitialized && !!firebaseAuthUser,
      onSettled(userResp) {
        if (!userResp) {
          push(isPencilLoginPage ? '/pencilSpacesLogin' : '/login');
        } else {
          if (isLoginPage || isPencilLoginPage) {
            push('/');
          }
        }
      }
    }
  );

  useEffect(() => {
    if (firebaseInitialized && !isFreeSpeedReadPage && !isProgramPage) {
      //   if (firebaseAuthUser && isLoginPage) push('/');
      if (!firebaseAuthUser) push(isPencilLoginPage ? '/pencilSpacesLogin' : '/login');
    }
  }, [firebaseInitialized, firebaseAuthUser]);

  useEffect(() => {
    const unlisten = auth().onAuthStateChanged((authUser) => {
      setFirebaseAuthUser(authUser ?? null);

      // The initialization must come after the authUser
      setFirebaseInitialized(true);
    });

    return () => {
      unlisten();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      await refetch();
    } catch (e) {
      // @ts-ignore
      toast.error(e);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (e) {
      // @ts-ignore
      toast.error(e);
    }
  };

  if (error) {
    return <Box>Unauthorized</Box>;
  }

  return (
    <PageLoading isLoading={!firebaseInitialized || isLoading}>
      <AuthContext.Provider
        value={{
          user,
          isLoading: isLoading || isFetching,
          isLogged: !!user,
          refetchUserDetails: refetch,
          signOut,
          sendPasswordResetEmail,
          signIn
        }}
      >
        {children}
      </AuthContext.Provider>
    </PageLoading>
  );
};
