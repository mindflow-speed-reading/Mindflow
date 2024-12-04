import React, { FC, useEffect, useMemo } from 'react';

import { Flex as ChakraFlex, Grid as ChakraGrid, Heading as ChakraHeading } from '@chakra-ui/react';
import { get, sortBy, uniqBy } from 'lodash';
import { useHistory } from 'react-router';
import { useQuery } from 'react-query';

import { ActivitiesResume, StudentComprehensionData, StudentSpeedReadingData } from 'components/analytics';
import { BaseCard, Icon, Loading } from 'components/common';
import {
  DiagnosticsResumed,
  Footer,
  ImprovementCard,
  NextLessons,
  ProgressCard,
  RecentActivities
} from 'components/Pages/Home';
import { UserEvolutionChart } from 'components/Pages/Home/UserEvolutionChart';

import { BrainEyeTestResult, Diagnostic, DiagnosticDocumentWithId, PracticeTestResult, UserActivity } from 'types';
import { FeedActivity, FeedActivityWithId } from 'types/firestoreDb/Feed';
import { useAuthContext, useFirebaseContext, useTestResultList } from 'lib/firebase';
import { usePlaylists } from 'lib/api';

export const Home: FC = () => {
  const { user, refetchUserDetails } = useAuthContext();

  const { firestore } = useFirebaseContext();

  const router = useHistory();

  const userDifficultLevel = user?.userDetails?.difficultLevel;
  const testType = user?.userDetails?.testType ?? '';

  const playlistsIds = ['zvephgab', 'mADJpTBb'];
  const [playlists, playlistsLoading] = usePlaylists(playlistsIds);

  useEffect(() => refetchUserDetails(), []);

  useEffect(() => {
    const tutorial = get(user, ['userDetails', 'activity', 'tutorial']);
    const tasks: boolean[] = Object.values(tutorial ?? {});
    const finishedTutorial = tasks.every((task) => task);

    if (!tasks.length || !finishedTutorial) {
      return router.push('/tutorial');
    }
  }, [user]);

  const { counters, userStats, watchedVideosIds } = useMemo<{
    counters: UserActivity['counters'];
    userStats: UserActivity['stats'];
    watchedVideosIds: string[];
  }>(() => {
    const userActivity = get(user, ['userDetails', 'activity']);
    const userStats = get(userActivity, 'stats');

    return {
      watchedVideosIds: Object.keys(userStats?.videos ?? {}),
      counters: userActivity?.counters,
      userStats
    };
  }, [user]);

  const essaysSizeQuery = useQuery(['texts'], async () => {
    const essaysQuery = await firestore.collection('essays').where('category', '==', userDifficultLevel).get();
    return essaysQuery.size;
  });

  const resumedDiagnosticResults = get(user, ['userDetails', 'activity', 'stats', 'diagnostics', testType]);
  const { data: diagnostics, isLoading: diagnosticsIsLoading } = useQuery(
    ['diagnostics', testType],
    async () => {
      const d = await firestore
        .collection('diagnostics')
        .limit(6)
        .where('category', '==', testType)
        .orderBy('order')
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

      return d.docs.map((doc) => doc.data());
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const feedQuery = useQuery(
    ['feed'],
    async () => {
      const feed = await firestore
        .collection('feed')
        .where('user.id', '==', user?.uid)
        .limit(20)
        .withConverter<FeedActivityWithId>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as FeedActivity)
            };
          },
          toFirestore: (doc: FeedActivity) => doc
        })
        .get();

      const feedEvents = feed.docs.map((doc) => doc.data());

      return sortBy(feedEvents, 'timestamp').reverse();
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true
    }
  );

  const brainEyeTestsResults = useTestResultList<BrainEyeTestResult>(['brain-eye-coordination']);
  const practiceTestsResults = useTestResultList<PracticeTestResult>(['practice']);

  const practicedTexts = uniqBy([...brainEyeTestsResults, ...practiceTestsResults], 'textId');

  const speedTestResultsQuantity = get(user, ['userDetails', 'activity', 'counters', 'speedRead'], 0);
  return (
    <ChakraFlex width="100%" height="100%" flexDirection="column">
      <ChakraGrid
        width="100%"
        marginBottom="lg"
        height={{ lg: '350px', md: 'fit-content' }}
        minHeight={{ lg: '350px', md: 'fit-content' }}
        gridTemplateColumns={{
          md: '1fr',
          lg: 'repeat(3, 1fr)',
          xl: '1fr 1fr 2fr'
        }}
      >
        <DiagnosticsResumed
          diagnostics={diagnostics}
          isLoading={diagnosticsIsLoading}
          resumedDiagnotiscsResults={resumedDiagnosticResults}
        />
        <ChakraFlex
          width="100%"
          flexDirection="column"
          paddingX={{ lg: 'lg', md: 'none' }}
          marginY={{ md: 'lg', lg: 'none' }}
        >
          <ProgressCard
            flex="1"
            title="Speed Assessment"
            value={speedTestResultsQuantity ?? 0}
            total={essaysSizeQuery.data ?? 0}
            isLoading={essaysSizeQuery.isLoading}
            isPercentage={false}
          />
          <ProgressCard
            flex="1"
            marginY="lg"
            title="Practices Completed"
            value={practiceTestsResults.length}
            total={essaysSizeQuery.data ?? 0}
            isLoading={essaysSizeQuery.isLoading}
            isPercentage={false}
          />
          <ImprovementCard
            flex="1"
            title="Improvement"
            value={userStats?.wordSpeed.firstWordSpeed}
            total={userStats?.wordSpeed.bestWordSpeed}
          />
        </ChakraFlex>
        <BaseCard
          title="Reading Speed and Comprehension History"
          maxWidth={{
            lg: '320px',
            xl: 'unset'
          }}
        >
          <ChakraFlex width="100%" height="90%" justifyContent="center" alignItems="center">
            <ChakraFlex width="100%" height="250px">
              <UserEvolutionChart stats={userStats} />
            </ChakraFlex>
          </ChakraFlex>
        </BaseCard>
      </ChakraGrid>
      <ChakraGrid
        width="100%"
        marginBottom="lg"
        height={{ lg: '350px', md: 'fit-content' }}
        minHeight={{ lg: '350px', md: 'fit-content' }}
        gridTemplateColumns={{ lg: '1.5fr 1fr 1.5fr', md: '1fr' }}
      >
        <ChakraFlex width="100%">
          <Loading width="100%" isLoading={playlistsLoading} boxSize="lg">
            <NextLessons playlists={playlists} watchedVideosIds={watchedVideosIds} />
          </Loading>
        </ChakraFlex>
        <ChakraFlex paddingX={{ lg: 'lg', md: 'none' }} marginY={{ md: 'lg', lg: 'none' }}>
          <ChakraGrid width="100%" gridTemplateColumns={{ lg: '1fr 1fr', md: '1fr 1fr 1fr' }} color="white">
            <BaseCard
              minHeight={{ lg: 190, md: 140 }}
              marginRight="sm"
              cursor="pointer"
              background="teal.500"
              marginBottom={{ lg: 'lg', md: 'none' }}
              _hover={{ bg: 'teal.300' }}
              onClick={() => router.push('/library')}
            >
              <ChakraFlex flexDirection="column" alignItems="center" justifyContent="space-around" height="100%">
                <Icon name="practice_skills" fontSize={{ lg: '4xl', xl: '5xl' }} />
                <ChakraHeading as="h2" textAlign="center" fontSize={{ lg: 'md', xl: 'xl' }}>
                  Practice
                  <br />
                  Skills
                </ChakraHeading>
              </ChakraFlex>
            </BaseCard>
            <BaseCard
              marginLeft="sm"
              background="blue.500"
              minHeight={{ lg: 190, md: 140 }}
              marginBottom={{ lg: 'lg', md: 'none' }}
              cursor="pointer"
              _hover={{ bg: 'blue.700' }}
              onClick={() => router.push('/speed-read')}
            >
              <ChakraFlex flexDirection="column" alignItems="center" justifyContent="space-around" height="100%">
                <Icon name="speed-reading-test" fontSize={{ lg: '4xl', xl: '5xl' }} />
                <ChakraHeading as="h2" textAlign="center" fontSize={{ lg: 'md', xl: 'xl' }}>
                  Speed
                  <br />
                  Reading
                  <br />
                  Test
                </ChakraHeading>
              </ChakraFlex>
            </BaseCard>
            <BaseCard
              cursor="pointer"
              background="red.500"
              marginLeft={{ md: 'sm', lg: 'none' }}
              minHeight={{ md: 140, lg: 'unset' }}
              gridColumn={{ lg: 'span 2' }}
              _hover={{ bg: 'red.800' }}
              onClick={() => router.push('/diagnostics')}
            >
              <ChakraFlex
                height="100%"
                alignItems="center"
                justifyContent={{ md: 'space-around', lg: 'unset' }}
                flexDirection={{ md: 'column', lg: 'row' }}
              >
                <Icon mr={{ lg: '4', md: 0 }} name="diagnostic-test" fontSize={{ lg: '4xl', xl: '5xl' }} />
                <ChakraHeading as="h2" textAlign={{ md: 'center', lg: 'unset' }} fontSize={{ lg: 'md', xl: 'xl' }}>
                  Take
                  <br />
                  Diagnostic
                  <br />
                  Test
                </ChakraHeading>
              </ChakraFlex>
            </BaseCard>
          </ChakraGrid>
        </ChakraFlex>
        <Loading isLoading={feedQuery.isLoading} boxSize="xl" maxH="350px">
          <RecentActivities activities={feedQuery.data ?? []} />
        </Loading>
      </ChakraGrid>
      <ChakraFlex flexDirection={{ lg: 'row', md: 'column' }}>
        <BaseCard marginBottom={{ md: 'lg', lg: 'unset' }} marginRight={{ lg: 'lg', md: 'unset' }}>
          <ActivitiesResume
            finishedDiagnostics={counters?.diagnostics}
            finishedSpeedReads={counters?.speedRead}
            finishedPractices={counters?.practices}
            finishedBrainEye={counters?.brainEyeCoordination}
            finishedVideos={watchedVideosIds.length}
          />
        </BaseCard>
        <ChakraFlex width="100%" flexDirection="column">
          <BaseCard width="100%" height="100%" marginBottom="lg">
            <StudentSpeedReadingData wordSpeedStats={userStats?.wordSpeed} />
          </BaseCard>
          <BaseCard width="100%" height="100%">
            <StudentComprehensionData comprehensionStats={userStats?.comprehension} />
          </BaseCard>
        </ChakraFlex>
      </ChakraFlex>
      <Footer />
    </ChakraFlex>
  );
};
