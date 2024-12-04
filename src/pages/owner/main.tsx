import React, { FC, useMemo, useEffect, useState } from 'react';

import { Flex as ChakraFlex, Grid as ChakraGrid } from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from 'react-query';
import moment from 'moment';
import { toast } from 'react-toastify';
import { colors } from 'theme/foundations';

import { StudentsRanking } from 'components/analytics';
import { AverageCard } from 'components/Pages/Business/Home';
import { BaseCard } from 'components/common';

import { useAuthContext, useFirebaseContext } from 'lib/firebase';

import { AnalyticDateSnapshot } from 'types/firestoreDb/Analytics';
import {
  FeedActivity,
  FeedActivityWithId,
  UserDetailsWithId,
  UserDetails,
  DiagnosticResult,
  DiagnosticResultDocumentWithId
} from 'types';

import {
  AnalyticsFilterForm,
  getSummedAnalyticSnapshot,
  LicensePanelFilters,
  MainPanelProgression,
} from 'components/Pages/Owner';

import {
  TestTypeBarChart,
  BusinessActivitiesResume,
  BusinessStudentHourLineChart,
  BusinessStudentRanking
} from 'components/Pages/BusinessDashboard';


import { isArray } from 'lodash';

import { StudentReadingImprovementData } from 'components/analytics/StudentReadingImprovementData';

export const OwnerMainPanel: FC = () => {
  const { firestore } = useFirebaseContext();

  const { getValues } = useFormContext();
  const { user } = useAuthContext();

  const today: Date = new Date();
  const yearAgo = new Date(today.getTime() - ((365 * 86400000)));
  const [selectedDates, setSelectedDates] = useState<Date[]>([yearAgo, new Date()]);
  const [dateChanged, setDateChanged] = useState(false);

  const handleSelectedDates = (selectedDates) => {
    setSelectedDates(selectedDates);
    setDateChanged(true);
  };

  const selectedDatesTimestamp = selectedDates.map(date => date.getTime());
  const [startDateTimestamp, endDateTimestamp] = selectedDatesTimestamp;

  const values = getValues();

  const businessID = user.userDetails.businessId;

  /*

  const analyticsQuery = useQuery(
    ['owner', 'analytics', values.startDate, values.endDate],
    async () => {

      const analyticsSnap = await firestore
        .collection('analytics')
        .where('timestampPeriod.start', '>=', startTimestamp)
        .where('timestampPeriod.end', '<=', endTimestamp)
        .limit(1)
        .withConverter<AnalyticDateSnapshot>({
          fromFirestore: (doc) => {
            return {
              id: doc.id,
              ...(doc.data() as AnalyticDateSnapshot)
            };
          },
          toFirestore: (doc: AnalyticDateSnapshot) => doc
        })
        .get();

      const analytics = analyticsSnap.docs.map((d) => d.data());
      return analytics;
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  const testResultsQuery = useQuery(
    ['owner', 'testResults', 'speedRead', values.startDate, values.endDate, values.difficultLevel, values.testType],
    async () => {

      const { difficultLevel, testType } = values;

      if (difficultLevel || testType) {
        const queryKey = difficultLevel ? 'difficultLevel' : 'testType';
        const queryValue = difficultLevel || testType;

        const testResultsSnap = await firestore
          .collection('testResults')
          .where('timestamp', '>=', startTimestamp)
          .where('timestamp', '<=', endTimestamp)
          .where(queryKey, '==', queryValue)
          .where('type', '==', 'speed-read')
          .limit(30)
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

        const feedEvents = testResultsSnap.docs.map((doc) => doc.data());

        return feedEvents;
      }

      const testResultsSnap = await firestore
        .collection('testResults')
        .where('timestamp', '<=', endTimestamp)
        .where('type', '==', 'speed-read')
        .limit(30)
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

      const feedEvents = testResultsSnap.docs.map((doc) => doc.data());
      return feedEvents;
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      onSuccess: console.log
    }
  );

  const currentSnapshot = useMemo(() => {
    return getSummedAnalyticSnapshot(analyticsQuery.data, values as AnalyticsFilterForm);
  }, [analyticsQuery.data, values]);

  const currentWordSpeedReports = useMemo(() => {
    if (!testResultsQuery.data?.length) return [];

    return testResultsQuery.data.map((result) => ({
      value: result.wordSpeed ?? 0,
      user: result.user
    }));
  }, [testResultsQuery.data]);

  const currentComprehensionReports = useMemo(() => {
    if (!testResultsQuery.data?.length) return [];

    const resultsWithComprehension = testResultsQuery.data.filter((result) => result.comprehensionAnswers?.length);

    return resultsWithComprehension.map((result) => ({
      value: result.wordSpeed ?? 0,
      user: result.user
    }));
  }, [testResultsQuery.data]);
*/
  const selectedTests = values.selectedTests?.map((test) => test.value);
  const selectedLevels = values.selectedLevels?.map((test) => test.value);
  const searchStudents = values.searchStudents;

  const studentsQuery = useQuery(
    ['students'],
    async () => {
      let usersSnap;
      let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('users');

      if (isArray(selectedLevels) && selectedLevels.length > 0) {
        query = query.where('difficultLevel', 'in', selectedLevels);
      }

      usersSnap = await query
        .where('businessId', '==', businessID)
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

      let students = usersSnap.docs.map((doc) => doc.data());

      if (searchStudents && searchStudents.length > 0) {
        const searchLower = searchStudents.toLowerCase();
        students = students.filter(student =>  student.firstName.toLowerCase().includes(searchStudents) || student.lastName.toLowerCase().includes(searchStudents));
      }

      if ((isArray(selectedTests) && selectedTests.length > 0)) {
        students = students.filter(student => selectedTests.some(test => student.testType === test));
      }

      if (dateChanged) {
        students = students.filter(student => student.license && student.license.activationDate);
        students = students.filter(student => student.license.activationDate >= startDateTimestamp);
        students = students.filter(student => student.license.activationDate <= endDateTimestamp);

      }


      return students;
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );


  const highestSpeedImprovementData = useMemo(() => {
    let student = '';
    let bestImprovement = 0;
    let firstWordSpeed = 0;
    let bestWordSpeed = 0;
    let speedReadingImprovementPercentage = 0;
    let scores = {};

    if (studentsQuery.data) {
      studentsQuery.data.forEach((item) => {
        if (
          bestImprovement <
          item.activity?.stats.wordSpeed.firstWordSpeed - item.activity?.stats.wordSpeed.bestWordSpeed
        ) {
          student = item.firstName + ' ' + item.lastName;
          firstWordSpeed = item.activity?.stats.wordSpeed.firstWordSpeed;
          bestWordSpeed = item.activity?.stats.wordSpeed.bestWordSpeed;
          bestImprovement =
            item.activity?.stats.wordSpeed.firstWordSpeed - item.activity?.stats.wordSpeed.bestWordSpeed;
          speedReadingImprovementPercentage = 100 - (bestWordSpeed * 100) / firstWordSpeed;
        }
      });

      scores = {
        student: student,
        firstWordSpeed: firstWordSpeed,
        bestWordSpeed: bestWordSpeed,
        speedReadingImprovement: bestImprovement,
        speedReadingImprovementPercentage: speedReadingImprovementPercentage.toFixed(2)
      };
    }
    return scores;
  }, [studentsQuery.data]);

  let getAverageStudentLevel = 0;
  let getAverageStudentComprehension = 0;
  let getAverageStudentWordSpeed = 0;

  if (Array.isArray(studentsQuery.data) && studentsQuery.data.length > 0) {
    getAverageStudentLevel =
      studentsQuery.data?.reduce((acc, curr) => acc + curr.level, 0) / studentsQuery.data?.length;

    getAverageStudentComprehension =
      studentsQuery.data?.reduce((acc, curr) => acc + curr.activity.stats.comprehension.averageComprehension, 0) / 100;

    getAverageStudentWordSpeed =
     studentsQuery.data?.reduce((acc, curr) => acc + curr.activity.stats.wordSpeed.averageWordSpeed, 0) / 100;
  }

  let highestComprehension = 0;
  let lowestComprehension = Number.POSITIVE_INFINITY;

  if (Array.isArray(studentsQuery.data)) {
    for (const user of studentsQuery.data) {
      const averageComprehension = user.activity.stats.comprehension.averageComprehension;

      if (averageComprehension > highestComprehension) {
        highestComprehension = averageComprehension;
      }

      if (averageComprehension < lowestComprehension && averageComprehension > 0) {
        lowestComprehension = averageComprehension;
      }
    }
  }

  if (lowestComprehension === Number.POSITIVE_INFINITY) {
    lowestComprehension = 0;
  }

  const getAverageImprovement =  useMemo(() => {
    const arrAverageImprovement = []
    if (Array.isArray(studentsQuery.data)) {
      for (const user of studentsQuery.data) {
        arrAverageImprovement.push(user.activity?.stats.wordSpeed.bestWordSpeed  - user.activity?.stats.wordSpeed.firstWordSpeed);
      }
    }

    const averageImprovement = Math.abs(arrAverageImprovement.reduce((acc, current) => acc + current, 0)) / arrAverageImprovement.length;

    return averageImprovement;

  }, [studentsQuery.data]);

  const getAllDiagnosticResults = useQuery(
    ['owner', 'reports', 'diagnosticResults'],
    async () => {
      const categories = ['gmat', 'high school', 'sat', 'shsat', 'gre']; // Example categories

      let diagnosticResultsSnap;
      let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('diagnosticResults');

      diagnosticResultsSnap = await query
        .where('category', 'in', categories)
        .where('businessId', '==', businessID)
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

      const diagnosticResults = diagnosticResultsSnap.docs.map((doc) => doc.data());
      const categorizedResults: Record<string, DiagnosticResult[]> = {};

      categories.forEach((category) => {
        categorizedResults[category] = diagnosticResults.filter((result) => result.category === category);
      });

      return categorizedResults;
    },
    {
      refetchOnMount: false,
      onError: (err: Error) => {
        toast.error(err?.message);
      }
    }
  );

    const highestScoresPerCategory = useMemo(() => {
      const scores = [];

      if (getAllDiagnosticResults.data) {
        const color = ['orange', 'blue', 'red', 'teal', 'green'];
        let colorIndex = 0;

        for (const [category, diagnostics] of Object.entries(getAllDiagnosticResults.data)) {
          let latestDiagnostic = null;

          for (const diagnostic of diagnostics) {
            const timestamp = diagnostic.timestamp;
            const scorePercentage = diagnostic?.result?.scorePercentage || 0;

            if (category === 'shsat' && scorePercentage === 0) {
              continue; // Skip diagnostics with scorePercentage 0 for "shsat" category
            }

            if (!latestDiagnostic || timestamp > latestDiagnostic.timestamp) {
              latestDiagnostic = diagnostic;
            }
          }

          const score = {
            name: category.toLocaleUpperCase(),
            score: latestDiagnostic?.result?.scorePercentage || 0,
            fill: colors[color[colorIndex]][500]
          };

          scores.push(score);

          colorIndex = (colorIndex + 1) % color.length;
        }
      }

      return scores;
    }, [getAllDiagnosticResults.data]);

    const highestReadingSpeedImprovement = useMemo(() => {
      const scores = [];
      const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];
      const color = ['orange', 'blue', 'red', 'teal', 'green'];

      if (studentsQuery.data) {
        const testTypeData = {};

        studentsQuery.data.forEach((item) => {
          const testType = item.testType;
          const startingSpeed = item.activity?.stats.wordSpeed.firstWordSpeed;
          const currentSpeed = item.activity?.stats.wordSpeed.lastWordSpeed;

          if (testTypesToShow.includes(testType) && startingSpeed !== undefined && currentSpeed !== undefined) {
            if (!testTypeData[testType]) {
              testTypeData[testType] = {
                highestSpeedImprovement: startingSpeed - currentSpeed
              };
            } else {
              const speedImprovement = startingSpeed - currentSpeed;
              testTypeData[testType].highestSpeedImprovement = Math.max(
                testTypeData[testType].highestSpeedImprovement,
                speedImprovement
              );
            }
          }
        });

        testTypesToShow.forEach((testType, index) => {
          const testData = testTypeData[testType];
          if (testData) {
            const speedImprovement = testData.highestSpeedImprovement;

            const score = {
              name: testType.toUpperCase(),
              score: speedImprovement,
              fill: colors[color[index]][500]
            };

            scores.push(score);
          }
        });
      }

      return scores;
    }, [studentsQuery.data]);



    const averageSpeedReadImprovement = useMemo(() => {
      const scores = [];
      const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];

      if (studentsQuery.data) {
        const color = ['orange', 'blue', 'red', 'teal', 'green'];
        let colorIndex = 0;

        const testTypeData = {};

        studentsQuery.data.forEach((item) => {
          const testType = item.testType;
          const averageWordSpeed = item.activity?.stats.wordSpeed.averageWordSpeed;

          if (testTypesToShow.includes(testType) && averageWordSpeed !== undefined) {
            if (!testTypeData[testType]) {
              testTypeData[testType] = {
                sum: averageWordSpeed,
                count: 1
              };
            } else {
              testTypeData[testType].sum += averageWordSpeed;
              testTypeData[testType].count += 1;
            }
          }
        });

        testTypesToShow.forEach((testType, index) => {
          if (testTypeData[testType] && testTypeData[testType].count > 0) {
            const averageBestWordSpeed = testTypeData[testType].sum / testTypeData[testType].count;

            const score = {
              name: testType.toUpperCase(),
              score: Number(averageBestWordSpeed.toFixed()), // Round to 2 decimal places
              fill: colors[color[colorIndex]][500]
            };

            scores.push(score);
            colorIndex = (colorIndex + 1) % color.length;
          }
        });
      }

      return scores;
    }, [studentsQuery.data]);

    const averageSpeedReadImprovementStartingBest = useMemo(() => {
      const scores = [];
      const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];

      if (studentsQuery.data) {
        const testTypeData = {};
        studentsQuery.data.forEach((item) => {
          const testType = item.testType;
          const averageWordSpeed = item.activity?.stats.wordSpeed.averageWordSpeed;
          const bestWordSpeed = item.activity?.stats.wordSpeed.bestWordSpeed;

          if (testTypesToShow.includes(testType) && averageWordSpeed !== undefined && bestWordSpeed !== undefined) {
            if (!testTypeData[testType]) {
              testTypeData[testType] = {
                averageWordSpeedSum: averageWordSpeed,
                averageWordSpeedCount: 1,
                bestWordSpeed: bestWordSpeed
              };
            } else {
              testTypeData[testType].averageWordSpeedSum += averageWordSpeed;
              testTypeData[testType].averageWordSpeedCount += 1;
              testTypeData[testType].bestWordSpeed = Math.max(testTypeData[testType].bestWordSpeed, bestWordSpeed);
            }
          }
        });

        testTypesToShow.forEach((testType) => {
          const testData = testTypeData[testType];
          if (testData && testData.averageWordSpeedCount > 0) {
            const averageBestWordSpeed = testData.averageWordSpeedSum / testData.averageWordSpeedCount;

            const score = {
              name: testType.toUpperCase(),
              StartingSpeed: Number(averageBestWordSpeed.toFixed()), // Round to 2 decimal places
              BestSpeed: testData.bestWordSpeed
            };

            scores.push(score);
          }
        });
      }

      return scores;
    }, [studentsQuery.data]);

    const getAllDiagnostics = useQuery(
      ['owner', 'reports', 'diagnostics'],
      async () => {
        let diagnosticSnap;
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('feed');

        diagnosticSnap = await query
          .where('type', '==', 'diagnostic')
          .where('businessId', '==', businessID)
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

        const diagnostic = diagnosticSnap.docs.map((doc) => doc.data());
        return diagnostic;
      },
      {
        refetchOnMount: false,
        onError: (err: Error) => {
          toast.error(err?.message);
        }
      }
    );

    const getAllSpeedRead = useQuery(
      ['owner', 'reports', 'speedRead'],
      async () => {
        let speedTestSnap;
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('feed');

        speedTestSnap = await query
          .where('type', '==', 'speed-read')
          .where('businessId', '==', businessID)
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

        const speedRead = speedTestSnap.docs.map((doc) => doc.data());
        return speedRead;
      },
      {
        refetchOnMount: false,
        onError: (err: Error) => {
          toast.error(err?.message);
        }
      }
    );

    const getAllPractices = useQuery(
      ['owner', 'reports', 'practices'],
      async () => {
        let practicesTestSnap;
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('feed');

        practicesTestSnap = await query
          .where('type', '==', 'practice')
          .where('businessId', '==', businessID)
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

        const practices = practicesTestSnap.docs.map((doc) => doc.data());
        return practices;
      },
      {
        refetchOnMount: false,
        onError: (err: Error) => {
          toast.error(err?.message);
        }
      }
    );

    const getAllBrainEye = useQuery(
      ['owner', 'reports', 'brain-eye-coordination'],
      async () => {
        let brainEyeSnap;
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('feed');

        brainEyeSnap = await query
          .where('type', '==', 'brain-eye-coordination')
          .where('businessId', '==', businessID)
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

        const brainEye = brainEyeSnap.docs.map((doc) => doc.data());
        return brainEye;
      },
      {
        refetchOnMount: false,
        onError: (err: Error) => {
          toast.error(err?.message);
        }
      }
    );

    const getAllWatchedVideos = useQuery(
      ['owner', 'reports', 'video'],
      async () => {
        let watchedVideosSnap;
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('feed');

        watchedVideosSnap = await query
          .where('type', '==', 'video')
          .where('businessId', '==', businessID)
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

        const watchedVideos = watchedVideosSnap.docs.map((doc) => doc.data());
        return watchedVideos;
      },
      {
        refetchOnMount: false,
        onError: (err: Error) => {
          toast.error(err?.message);
        }
      }
    );


  const averageDiagnosticsPerStudent = useMemo(() => {
    if (!getAllDiagnostics.data) {
      return 0;
    }

    const totalDiagnostics = getAllDiagnostics.data.length;
    const totalStudents = studentsQuery.data?.length || 0;

    if (totalStudents === 0) {
      return 0;
    }

    const average = totalDiagnostics / totalStudents;
    return Number(average.toFixed());
  }, [getAllDiagnostics.data, studentsQuery.data]);

  const averageSpeedTestPerStudent = useMemo(() => {
    if (!getAllSpeedRead.data) {
      return 0;
    }

    const totalSpeed = getAllSpeedRead.data.length;
    const totalStudents = studentsQuery.data?.length || 0;

    if (totalStudents === 0) {
      return 0;
    }

    const average = totalSpeed / totalStudents;
    return Number(average.toFixed());
  }, [getAllSpeedRead.data, studentsQuery.data]);

  const averagePracticesPerStudent = useMemo(() => {
    if (!getAllPractices.data) {
      return 0;
    }

    const totalSpeed = getAllPractices.data.length;
    const totalStudents = studentsQuery.data?.length || 0;

    if (totalStudents === 0) {
      return 0;
    }

    const average = totalSpeed / totalStudents;
    return Number(average.toFixed());
  }, [getAllPractices.data, studentsQuery.data])

  const averageBrainEyePerStudent = useMemo(() => {
    if (!getAllBrainEye.data) {
      return 0;
    }

    const totalSpeed = getAllBrainEye.data.length;
    const totalStudents = studentsQuery.data?.length || 0;

    if (totalStudents === 0) {
      return 0;
    }

    const average = totalSpeed / totalStudents;
    return Number(average.toFixed());
  }, [getAllBrainEye.data, studentsQuery.data]);

  const averageVideosPerStudent = useMemo(() => {
    if (!getAllWatchedVideos.data) {
      return 0;
    }

    const totalSpeed = getAllWatchedVideos.data.length;
    const totalStudents = studentsQuery.data?.length || 0;

    if (totalStudents === 0) {
      return 0;
    }

    const average = totalSpeed / totalStudents;
    return Number(average.toFixed());
  }, [getAllWatchedVideos.data, studentsQuery.data]);


  const sortedUsersByComprehensionRanking = useMemo(() => {
    const users = [];
    const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];

    if (studentsQuery.data) {
      studentsQuery.data.forEach((item) => {
        const testType = item.testType;
        const averageComprehension = item.activity?.stats.comprehension.lastComprehension;

        if (testTypesToShow.includes(testType) && averageComprehension !== undefined) {
          users.push({ ...item, rank: item.activity?.stats.comprehension.lastComprehension });
        }
      });

      users.sort(
        (a, b) =>
          b.activity?.stats.comprehension.averageComprehension - a.activity?.stats.comprehension.averageComprehension
      );
    }

    return users;
  }, [studentsQuery.data]);

  const sortedUsersBySpeedReadRanking = useMemo(() => {
    const users = [];
    const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];

    if (studentsQuery.data) {
      studentsQuery.data.forEach((item) => {
        const testType = item.testType;
        const averageSpeedReadRanking = item.activity?.stats.wordSpeed.lastWordSpeed;

        if (testTypesToShow.includes(testType) && averageSpeedReadRanking !== undefined) {
          users.push({ ...item, rank: item.activity?.stats.wordSpeed.lastWordSpeed });
        }
      });

      users.sort((a, b) => b.activity?.stats.wordSpeed.lastWordSpeed - a.activity?.stats.wordSpeed.lastWordSpeed);
    }

    return users;
  }, [studentsQuery.data]);

  const studentsPerTestType = useMemo(() => {
    const testTypeCounts = {};
    const testTypesToShow = ['gmat', 'sat', 'shsat', 'gre'];
    const color = ['orange', 'blue', 'red', 'teal', 'green'];

    studentsQuery.data?.forEach((item) => {
      const testType = item.testType;
      if (testType && testTypesToShow.includes(testType)) {
        const uppercaseTestType = testType;
        testTypeCounts[uppercaseTestType] = (testTypeCounts[uppercaseTestType] || 0) + 1;
      }
    });

    return Object.entries(testTypeCounts).map(([name, students], index) => ({
      name,
      score: students,
      fill: colors[color[index]][500] // Use modulo to cycle through colors
    }));
  }, [studentsQuery.data]);


  const refetchAllQueries = () => {
    studentsQuery.refetch();
    getAllDiagnosticResults.refetch();
    getAllDiagnostics.refetch();
    getAllWatchedVideos.refetch();
    getAllPractices.refetch();
    getAllSpeedRead.refetch();
    getAllBrainEye.refetch();
  };

  useEffect(() => {
    refetchAllQueries();
  }, [selectedTests, selectedLevels, searchStudents, selectedDates]);

  return (
    <ChakraGrid height="100%"
      gridRowGap="md"
      gridColumnGap="md"
      gridTemplateColumns="300px 1fr 1fr">
      <ChakraFlex flexDirection="column" gridColumn={{ lg: '1/2', md: '1/4' }}>
        <LicensePanelFilters selectedDates={selectedDates} setSelectedDates={handleSelectedDates} />
      </ChakraFlex>
      <ChakraGrid
        gridRowGap="md"
        gridColumnGap="md"
        gridColumn={{ lg: '2/3', md: '1/4' }}
        gridTemplateColumns="repeat(2, 1fr)"
      >
        <AverageCard
          width="100%"
          value={studentsQuery.data?.length}
          icon="students"
          description="Total Students"
          color="blue"
        />
        <AverageCard
          width="100%"
          value={4}
          icon="company"
          description="Test levels"
          color="blue"
        />
        <AverageCard
          width="100%"
          value={Math.floor(getAverageStudentLevel)}
          icon="star"
          description="Average Level"
          color="red"
        />
        <AverageCard
          width="100%"
          value={getAverageStudentComprehension.toFixed()}
          icon="assignment"
          description="Average Comprehension"
          color="red"
        />
        <AverageCard
          width="100%"
          value={getAverageStudentWordSpeed.toFixed()}
          icon="view"
          description="Average Speed Reading"
          color="orange"
        />
        <AverageCard
          width="100%"
          value={getAverageImprovement.toFixed()}
          icon="bar-chart"
          description="Average Improvement"
          color="orange"
        />
        <AverageCard
          width="100%"
          value={lowestComprehension.toFixed()}
          icon="arrow-up"
          description="Lowest comprehension"
          color="gray"
          />
        <AverageCard
          width="100%"
          value={highestComprehension.toFixed()}
          icon="arrow-down"
          description="Highest comprehension"
          color="gray"
          />
      </ChakraGrid>
          <BaseCard
            background="linear-gradient(180deg, #05314A 20.65%, #94D4D6 100%);"
            borderRadius={10}
            width="fit-content"
            title="Highest Speed reading improvement data"
            alignText="start"
            color="white"
          >
          <StudentReadingImprovementData data={highestSpeedImprovementData} />
        </BaseCard>
        <ChakraGrid
        gridTemplateColumns={'490px 1fr'}
        gridTemplateRows="repeat(2, 350px)"
        gridColumn="1/4"
        gridGap={8}
        rowGap={6}
      >
        <TestTypeBarChart
          title="Highest reading speed score per test type"
          data={highestScoresPerCategory}
          compareSpeed={true}
        />
        <TestTypeBarChart
          title="Highest reading speed improvement per test type"
          data={highestReadingSpeedImprovement}
          compareSpeed={true}
        />
        <TestTypeBarChart
          title="Speed reading average improvement per test type"
          data={averageSpeedReadImprovement}
          compareSpeed={true}
        />
        <TestTypeBarChart
          title="Average speed reading starting and best score per test type"
          data={averageSpeedReadImprovementStartingBest}
          compareSpeed={false}
        />
      </ChakraGrid>
      <ChakraGrid gridTemplateColumns={'490px 1fr'} gridColumn="1/4" gridGap={8}>
        <BusinessActivitiesResume
          title="Total of Activities completed"
          color="blue.500"
          iconColor="teal.500"
          finishedDiagnostics={getAllDiagnostics.data?.length}
          finishedSpeedReads={getAllSpeedRead.data?.length}
          finishedPractices={getAllPractices.data?.length}
          finishedBrainEye={getAllBrainEye.data?.length}
          finishedVideos={getAllWatchedVideos.data?.length}
        />
        <BusinessActivitiesResume
          title="Average number of activities completed per student"
          color="red.500"
          iconColor="orange.500"
          finishedDiagnostics={averageDiagnosticsPerStudent}
          finishedSpeedReads={averageSpeedTestPerStudent}
          finishedPractices={averagePracticesPerStudent}
          finishedBrainEye={averageBrainEyePerStudent}
          finishedVideos={averageVideosPerStudent}
        />
      </ChakraGrid>
      <ChakraGrid gridTemplateColumns={'490px 1fr'} gridTemplateRows="500px" gridColumn="1/4" gridGap={8}>
        <BusinessStudentRanking title="Comprehension Ranking" data={sortedUsersByComprehensionRanking.slice(0, 8)} />
        <BusinessStudentRanking title="Speed Reading Ranking" data={sortedUsersBySpeedReadRanking.slice(0, 8)} />
      </ChakraGrid>
      <ChakraGrid
        gridTemplateColumns={'600px 1fr'}
        gridTemplateRows="repeat(1, 350px)"
        gridColumn="1/4"
        gridGap={8}
        rowGap={6}
        mb={5}
      >
        <TestTypeBarChart title="Number of students per test type" data={studentsPerTestType} compareSpeed={true} />
        <BusinessStudentHourLineChart title="Active Students and Hours during per Date" businesses={[]} />
      </ChakraGrid>
    </ChakraGrid>

  );
};
