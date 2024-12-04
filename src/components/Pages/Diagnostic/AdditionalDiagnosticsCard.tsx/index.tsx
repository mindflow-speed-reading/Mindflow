import { Box, Button, CircularProgress, CircularProgressLabel, Text } from '@chakra-ui/react';
import { useHistory } from 'react-router';
import React, { FC } from 'react';

import { DiagnosticRequirements, DiagnosticResultDocumentWithId, ResumedDiagnosticDocumentWithId } from 'types';
import { Icon, InfoDescription, Timer } from 'components/common';

interface DiagnosticCardProps {
  disabled?: boolean;
  diagnostic: ResumedDiagnosticDocumentWithId;
  requirements?: DiagnosticRequirements;
  result?: DiagnosticResultDocumentWithId;
  onGoToDiagnostic: (diagnostic: ResumedDiagnosticDocumentWithId) => void;
}

export const AdditionalDiagnosticsCard: FC<DiagnosticCardProps> = ({
  result,
  diagnostic,
  disabled = false,
  requirements,
  onGoToDiagnostic
}) => {
  const { push } = useHistory();

  if (!result && disabled) {
    return (
      <Box py={4} px={2}>
        <Button
          width="90%"
          my="md"
          size="sm"
          display="block"
          mx="auto"
          variant="solid"
          colorScheme="gray"
          disabled={true}
        >
          <Icon name="lock" size="sm" color="gray.500" mr={2} mb={1} />
          {diagnostic.name}
        </Button>
      </Box>
    );
  }

  if (!result) {
    return (
      <>
        <Button
          width="90%"
          my="md"
          display="block"
          mx="auto"
          size="sm"
          variant="solid"
          colorScheme="orange"
          onClick={() => onGoToDiagnostic(diagnostic)}
        >
          <Icon name="unlock" size="sm" color="white" mr={2} mb={1} />
          {diagnostic.name}
        </Button>
      </>
    );
  }

  const resultDetails = result.result;

  return (
    <Box boxShadow="md" borderRadius="sm">
      <Box py={4} px={2}>
        <Button colorScheme="green" width="90%" size="sm" my="md" display="block" mx="auto">
          {diagnostic.name}
        </Button>
        <Box mt={4} display="flex" alignItems="center" flexDirection="column">
          <Text color="gray.500" fontSize="sm">
            Your score:
          </Text>

          <Box>
            <CircularProgress value={resultDetails?.scorePercentage ?? 0} color="green.300" size="100px" my={2}>
              <CircularProgressLabel>{resultDetails?.scorePercentage ?? 0}%</CircularProgressLabel>
            </CircularProgress>
          </Box>

          <Box>
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Total Time: <Timer time={resultDetails?.totalTime ?? 0} fontSize="sm" />
            </Text>
          </Box>
        </Box>
      </Box>
      <Box py={4} px={2} bg="gray.100" textAlign="center">
        <InfoDescription
          label="Correct Answers"
          description={`${resultDetails?.totalScore ?? 0}/${resultDetails?.totalOfQuestions ?? 0}`}
          fontSize="sm"
        />
        <Box textAlign="center" my={3}>
          <Button
            variant="outline"
            colorScheme="blue"
            size="sm"
            onClick={() => push(`/diagnostics/${diagnostic.id}/result`)}
          >
            Check result
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
