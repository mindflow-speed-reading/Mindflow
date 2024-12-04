import React, { FC, useMemo } from 'react';

import { get, merge } from 'lodash';
import { SimpleGrid } from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useMutation, useQuery } from 'react-query';

import { useHistory } from 'react-router';

import { Diagnostic, DiagnosticDocumentWithId, Essay, EssayDocumentWithId, UserTutorial } from 'types';

import { BasePage } from 'components/layout/Pages';

import { TutorialInstructions, TutorialTimeline } from './index';
import { useAuthContext, useFirebaseContext } from 'lib/firebase';

interface Props {}

export type TutorialVideoType = 'welcome' | 'tutorial';
export const TutorialContainer: FC<Props> = ({}) => {
  const { firestore } = useFirebaseContext();
  const { isLoading: isLoadingUser, refetchUserDetails, user } = useAuthContext();

  const history = useHistory();

  const tutorial = useMemo(
    () =>
      get(user, ['userDetails', 'activity', 'tutorial'], {
        welcomeVideo: false,
        speedReadingTest: false,
        diagnosticTest: false,
        tutorialVideo: false,
        finished: false
      }),
    [user]
  );

  const userDifficultLevel = user?.userDetails?.difficultLevel;
  const testType = user?.userDetails?.testType ?? '';

  const updateTutorialKeyMutation = useMutation(async (key: keyof UserTutorial) => {
    try {
      const newTutorial = merge(tutorial, { [key]: true });
      await firestore
        .collection('users')
        .doc(user?.uid)
        .set(
          {
            activity: {
              tutorial: newTutorial
            }
          },
          { merge: true }
        );

      refetchUserDetails();
      // router.push('/tutorial');
    } catch (e) {
      console.log(e);
    }
  });

  const pretestEssayQuery = useQuery(
    ['pretest', 'essay', userDifficultLevel],
    async () => {
      const preTestQuery = await firestore
        .collection('essays')
        .where('preTest', '==', true)
        .where('category', '==', userDifficultLevel)
        .limit(1)
        .withConverter<EssayDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as Essay)
            };
          },
          toFirestore: (doc: Essay) => doc
        })
        .get();

      const [essay] = preTestQuery.docs.map((doc) => doc.data());
      if (!essay) throw new Error(`A pretest was not found for this request ${userDifficultLevel}`);

      return essay;
    },
    {
      refetchOnWindowFocus: false,
      onError(e) {
        toast.error("We've had a problem, please contact our support!");
        console.error(e);

        history.push('/');
      }
    }
  );

  const diagnosticQuery = useQuery(
    ['pretest', 'diagnostic', userDifficultLevel],
    async () => {
      const diagnosticsQuery = await firestore
        .collection('diagnostics')
        .limit(1)
        .where('category', '==', testType)
        .where('order', '==', 0)
        .withConverter<DiagnosticDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as Diagnostic)
            };
          },
          toFirestore: (doc: Diagnostic) => doc
        })
        .get();

      const [diagnostic] = diagnosticsQuery.docs.map((doc) => doc.data());

      return diagnostic;
    },
    {
      refetchOnWindowFocus: false,
      onError(e) {
        toast.error("We've had a problem, please contact our support!");
        console.error(e);

        history.push('/');
      }
    }
  );

  const checkTestResult = useQuery(
    ['testResult', 'user', userDifficultLevel],
    async () => {
      const testResult = await firestore
        .collection('testResults')
        .where('userId', '==', user?.uid)
        .where('essayId', '==', pretestEssayQuery.data?.id)
        .get();

      return testResult.empty ? null : testResult.docs[0].data();
    },
    {
      enabled: !!pretestEssayQuery.data,
      refetchOnWindowFocus: true,
      onSuccess(result) {
        if (result && !tutorial.speedReadingTest) {
          updateTutorialKeyMutation.mutate('speedReadingTest');
          refetchUserDetails();
        }
      }
    }
  );

  const checkDiagnosticResult = useQuery(
    ['diagnostic', 'user', userDifficultLevel],
    async () => {
      const diangnosticResult = await firestore
        .collection('diagnosticResults')
        .where('userId', '==', user?.uid)
        .where('diagnosticId', '==', diagnosticQuery.data?.id)
        .get();

      return diangnosticResult.empty ? null : diangnosticResult.docs[0].data();
    },
    {
      enabled: !!diagnosticQuery.data,
      refetchOnWindowFocus: true,
      onSuccess(result) {
        if (result && !tutorial.diagnosticTest) {
          updateTutorialKeyMutation.mutate('diagnosticTest');
          refetchUserDetails();
        }
        // updateTutorialKeyMutation.mutate('finished');
      }
    }
  );

  const handleStartVideo = (videoType: TutorialVideoType) => {
    const videoEl = document.getElementById(videoType);

    if (videoEl) {
      // I tried to find a better way, but the lib doesnt seem to have a way to play a video
      const [playerEl] = videoEl.getElementsByClassName('jw-icon jw-icon-display jw-button-color jw-reset');

      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // @ts-ignore
        playerEl.click();

        return;
      }
    }

    toast.info(`You can proceed and play the ${videoType} video!`);
  };

  const onVideoFinish = (videoType: TutorialVideoType) => {
    if (videoType === 'welcome' && !tutorial.welcomeVideo) {
      updateTutorialKeyMutation.mutate('welcomeVideo');
    }
    if (videoType === 'tutorial' && tutorial.speedReadingTest && !tutorial.tutorialVideo) {
      updateTutorialKeyMutation.mutate('tutorialVideo');
      updateTutorialKeyMutation.mutate('finished');
    }
  };

  const isLoading =
    pretestEssayQuery.isLoading || isLoadingUser || checkDiagnosticResult.isLoading || checkTestResult.isLoading;

  return (
    <BasePage boxShadow="none" spacing="md">
      <SimpleGrid columns={2} spacing={10}>
        <TutorialInstructions onVideoFinish={onVideoFinish} />
        <TutorialTimeline
          isLoading={isLoading}
          handleStartVideo={handleStartVideo}
          tutorial={tutorial}
          diagnostic={diagnosticQuery.data}
          essay={pretestEssayQuery.data}
          wordSpeed={checkTestResult.data?.wordSpeed}
        />
      </SimpleGrid>
    </BasePage>
  );
};
