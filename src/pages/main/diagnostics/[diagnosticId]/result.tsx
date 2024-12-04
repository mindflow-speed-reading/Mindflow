import { get } from 'lodash';
import { useParams } from 'react-router';
import { useQuery } from 'react-query';
import React, { FC, useMemo } from 'react';

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Heading,
  Text
} from '@chakra-ui/react';
import { HtmlRender } from 'components/common/HtmlRender';

import { BasePage, BasePageTitle } from 'components/layout/Pages';
import { DiagnosticQuestionResult } from 'components/Pages/Diagnostic';
import { InfoDescription, Timer } from 'components/common';

import {
  Diagnostic,
  DiagnosticDocumentWithId,
  DiagnosticResultDocumentWithId,
  DiagnosticResult as FirestoreDiagnosticResult
} from 'types';
import { useAuthContext, useFirebaseContext } from 'lib/firebase';

export const DiagnosticResult: FC<{}> = () => {
  const { user } = useAuthContext();

  const { diagnosticId } = useParams<{ diagnosticId: string }>();

  const { firestore } = useFirebaseContext();

  const diagnosticResultQuery = useQuery(
    ['diagnostics', diagnosticId, 'result'],
    async () => {
      const diagnosticResultSnap = await firestore
        .collection('diagnosticResults')
        .where('userId', '==', user?.uid)
        .where('diagnosticId', '==', diagnosticId)
        .withConverter<DiagnosticResultDocumentWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as FirestoreDiagnosticResult)
            };
          },
          toFirestore: (doc: FirestoreDiagnosticResult) => doc
        })
        .get();

      const [result] = diagnosticResultSnap.docs.map((d) => d.data());

      return result;
    },
    {
      refetchOnWindowFocus: false
    }
  );

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
      refetchOnWindowFocus: false
    }
  );

  const questionsResults = useMemo(() => {
    return (diagnosticQuery.data?.questions ?? []).map((question, index) => {
      const answer = get(diagnosticResultQuery.data, ['answers', index]);
      const time = get(diagnosticResultQuery.data, ['answersTime', index]);

      return {
        time,
        answer,
        question,
        index
      };
    });
  }, [diagnosticResultQuery.data, diagnosticQuery.data]);

  const diagnosticText = useMemo(() => {
    const text = get(diagnosticQuery.data, ['text']);
    return text;
  }, [diagnosticQuery]);
  return (
    <BasePage width="100%" spacing="sm">
      <BasePageTitle
        showGoBack
        width="100%"
        display="flex"
        paddingBottom="md"
        alignItems="baseline"
        justifyContent="space-between"
        title="Diagnostic Test"
      ></BasePageTitle>
      {diagnosticResultQuery.data && (
        <>
          <Box display="flex" flexDir="column" alignItems="center">
            <Heading textStyle="title-with-border-bottom" mb={4}>
              Results
            </Heading>

            <Heading fontSize="xl">Your Score</Heading>

            <Box my={4}>
              <CircularProgress
                value={diagnosticResultQuery.data?.result?.scorePercentage ?? 0}
                color="green.400"
                size="100px"
              >
                <CircularProgressLabel>{diagnosticResultQuery.data?.result?.totalScore ?? 0}</CircularProgressLabel>
              </CircularProgress>
            </Box>

            <Text my={2}>
              Total Time:
              <Timer
                time={diagnosticResultQuery.data?.result?.totalTime ?? 0}
                as="span"
                fontSize="md"
                fontWeight="bold"
                color="black"
              />
            </Text>

            <Box my={4}>
              <Text as="span" pl={1} color="black" fontWeight="400">
                {diagnosticQuery.data?.name}
              </Text>
              <InfoDescription
                label="Diagnostic"
                description={diagnosticQuery.data?.name}
                isLoading={diagnosticQuery.isLoading}
                fontSize="sm"
              />
              <InfoDescription
                label="Questions"
                description={diagnosticResultQuery.data?.result?.totalOfQuestions ?? '-'}
                fontSize="sm"
                isLoading={diagnosticQuery.isLoading}
              />
            </Box>
          </Box>
          <Divider my={4} />
          <Box width={{ lg: '70%', md: '100%' }} mx="auto">
            <Box>
              <Accordion allowToggle bg="blue.100">
                <AccordionItem>
                  <h2>
                    <AccordionButton fontWeight="500">
                      <Box flex="1" textAlign="left">
                        Read Essay
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <HtmlRender
                      html={`
              <style>
              .htmlRender {
                  text-indent: 25px;
                  font-size: 16px;
                }
              </style>
              <div class='htmlRender'>
                ${diagnosticText}
              </div>
            `}
                    />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            {questionsResults.map((questionResult, index) => {
              return <DiagnosticQuestionResult {...questionResult} key={index} my={4} />;
            })}
          </Box>
        </>
      )}
    </BasePage>
  );
};
