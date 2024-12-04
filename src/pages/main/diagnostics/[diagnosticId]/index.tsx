import React, { FC, useEffect, useState } from 'react';

import { Box, Flex } from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useHistory, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { BasePage, BasePageTitle } from 'components/layout/Pages';
import { DiagnosticForm } from 'components/Pages/Diagnostic';
import { HtmlRender, Loading, Timer } from 'components/common';

import {
  Diagnostic,
  DiagnosticAnswerOption,
  DiagnosticDocumentWithId,
  DiagnosticResult,
  DiagnosticResultDocumentWithId
} from 'types';
import { useAuthContext, useFirebaseContext } from 'lib/firebase';
import { useTimer } from 'lib/customHooks';

interface Props {}

export const DiagnosticTest: FC<Props> = () => {
  const { firestore } = useFirebaseContext();
  const { user, refetchUserDetails } = useAuthContext();

  const { push } = useHistory();
  // const history = useHistory();
  const { diagnosticId } = useParams<{ diagnosticId: string }>();
  const queryClient = useQueryClient();

  const [timeIsOver, setTimeIsOver] = useState<boolean>(false);
  const [tutorialDiagnosticId, setTutorialDiagnosticId] = useState<string>();

  const [time] = useTimer({
    started: true
  });

  useEffect(() => {
    let backButtonPrevented: boolean = false;
    if (location.pathname === `/diagnostics/${tutorialDiagnosticId}`) {
      history.pushState(null, document.title, window.location.href);

      const popStateListener = (event) => {
        if (backButtonPrevented === false) {
          history.pushState(null, document.title, window.location.href);
          toast.error('You can not go back during a test.');
        } else {
          window.removeEventListener('popstate', popStateListener);
        }
      };
      window.addEventListener('popstate', popStateListener);
    }
    return () => {
      backButtonPrevented = true;
    };
  }, [timeIsOver, tutorialDiagnosticId]);

  const diagnosticQuery = useQuery(
    ['diagnostics', diagnosticId],
    async () => {
      const diagnosticSnap = await firestore
        .collection('diagnostics')
        .doc(diagnosticId)
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

      return diagnosticSnap.data();
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      onSuccess: (diagnostic) => {
        if (diagnostic.order === 0) {
          setTutorialDiagnosticId(diagnostic.id);
        }
      }
    }
  );

  const createDiagnosticResult = useMutation(
    async () => {
      const defaultDiagnosticResult = {
        finished: false,

        diagnosticId: diagnosticQuery.data.id,

        name: diagnosticQuery.data.name,
        category: diagnosticQuery.data.category,
        order: diagnosticQuery.data.order,

        answers: [],
        answersTime: [],

        userId: user?.uid,
        user: {
          id: user?.uid,
          firstName: user?.userDetails?.firstName ?? '',
          lastName: user?.userDetails?.lastName ?? '',
          email: user?.userDetails?.email ?? '',
          picture: user?.userDetails?.picture ?? ''
        },
        timestamp: +new Date()
      } as DiagnosticResult;

      if (user?.userDetails?.businessId) {
        defaultDiagnosticResult.businessId = user?.userDetails?.businessId;
      }

      firestore.collection('diagnosticResults').add(defaultDiagnosticResult);
    },
    {
      onSuccess() {
        queryClient.invalidateQueries(['diagnosticResults', diagnosticId]);
      }
    }
  );

  const diagnosticResultQuery = useQuery(
    ['diagnosticResults', diagnosticId],
    async () => {
      const diagnosticResultsQuery = await firestore
        .collection('diagnosticResults')
        .where('diagnosticId', '==', diagnosticId)
        .where('userId', '==', user?.uid)
        .withConverter<DiagnosticResultDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as DiagnosticResult)
            };
          },
          toFirestore: (doc: DiagnosticResult) => doc
        })
        .get();

      const [resultSnap] = diagnosticResultsQuery.docs;
      const result = resultSnap?.data();

      return result ?? null;
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess(result: DiagnosticResultDocumentWithId | null) {
        if (!result) {
          createDiagnosticResult.mutate();
          return;
        }

        if (result.finished) {
          toast.info('You already done this diagnostic!');
          return push(`/diagnostics/${result?.diagnosticId}/result`);
        }

        return result;
      }
    }
  );

  const { mutate: updateDiagnosticResult } = useMutation(
    ['updateDiagnosticResult'],
    async (data: DiagnosticResult) => {
      await firestore.collection('diagnosticResults').doc(diagnosticResultQuery.data?.id).update(data);
    },
    {
      async onSuccess() {
        refetchUserDetails();
      }
    }
  );

  const handleSaveQuestion = async ({
    answers,
    answersTime,
    finished
  }: {
    answers: DiagnosticAnswerOption[];
    answersTime: number[];
    finished: boolean;
  }) => {
    if (!diagnosticResultQuery.data) {
      return toast.error('An error has occurred');
    }

    const diagnosticResult: DiagnosticResult = {
      ...diagnosticResultQuery.data,
      finished,
      answers,
      answersTime
    };

    updateDiagnosticResult(diagnosticResult);
  };

  const handleSaveAndFinish = async ({
    answers,
    answersTime
  }: {
    answers: DiagnosticAnswerOption[];
    answersTime: number[];
  }) => {
    await handleSaveQuestion({
      answers,
      answersTime,
      finished: true
    });

    toast.success('Congratulations!');

    if (diagnosticQuery.data?.order === 0) {
      return push('/tutorial');
    }

    push(`/diagnostics/${diagnosticId}/result`);
  };

  const handleTimeIsOver = async ({
    answers,
    answersTime
  }: {
    answers: DiagnosticAnswerOption[];
    answersTime: number[];
  }) => {
    if (!timeIsOver) {
      setTimeIsOver(true);

      await handleSaveQuestion({
        answers,
        answersTime,
        finished: true
      });

      toast.info('Time is over! The diagnostic is finished and the results are saved.');

      if (diagnosticQuery.data?.order === 0) {
        return push('/tutorial');
      }

      push(`/diagnostics/${diagnosticId}/result`);
    }
  };

  return (
    <BasePage spacing="md">
      <Loading width="100%" height="100%" flexDirection="column" isLoading={diagnosticQuery.isLoading || timeIsOver}>
        <BasePageTitle d="flex" width="100%" title={diagnosticQuery.data?.name ?? ''}>
          <Box d="flex" justifyContent="flex-end" flexGrow={1}>
            <Timer time={time} />
          </Box>
        </BasePageTitle>
        <Flex justifyContent="space-between">
          <Box width={['100%', '45%']} mb={1}>
            <HtmlRender
              html={`
              <style>
                .htmlRender {
                  text-indent: 1em;
                }
              </style>
              <div class='htmlRender'>
                ${diagnosticQuery.data?.text.replace(/<strong>[\s\S]*?<\/strong>/g, '')}
              </div>
            `}
            />
          </Box>
          <Box width={['100%', '45%']}>
            <DiagnosticForm
              time={time}
              diagnostic={diagnosticQuery.data}
              onFinish={handleSaveAndFinish}
              onSaveQuestion={handleSaveQuestion}
              onTimeIsOver={handleTimeIsOver}
            />
          </Box>
        </Flex>
      </Loading>
    </BasePage>
  );
};
