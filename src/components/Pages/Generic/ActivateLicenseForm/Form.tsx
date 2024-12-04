import React, { FC } from 'react';

import {
  chakra,
  Button as ChakraButton,
  Flex as ChakraFlex,
  FormLabel as ChakraFormLabel,
  Heading as ChakraHeading,
  Input as ChakraInput,
  Select as ChakraSelect,
  SimpleGrid as ChakraSimpleGrid,
  Spinner as ChakraSpinner,
  Text as ChakraText
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import ReactInputMask from 'react-input-mask';

import {
  DifficultLevel,
  difficultTestTypeRelation,
  TestType,
  WhereDidYouHearAboutUs,
  whereDidYouHearAboutUsOptions
} from 'types';

import {
  currentLevelsOptions,
  currentLevelTestTypes,
  SelectedUserFields,
  SubmitValues,
  userSubmitSchema
} from './index';

import { Icon } from 'components/common';
import { toast } from 'react-toastify';

const MaskInput = chakra(ReactInputMask);

const WHERE_DID_YOU_HEAR_ABOUT_US_DESCRIPTIVE_OPTIONS: WhereDidYouHearAboutUs[] = [
  'consultant',
  'former',
  'test_prep_company',
  'dominate_prep',
  'tutor',
  'online_course',
  'school',
  'teacher',
  'club',
  'other'
];

interface SubmittedValues {
  user: SelectedUserFields;
  password: string;
}

interface ActivateLicenseFormProps {
  isLoading: boolean;
  defaultValues?: SubmittedValues;
  onSubmit: (values: SubmittedValues) => void;
}

export const ActivateLicenseForm: FC<ActivateLicenseFormProps> = ({ isLoading, onSubmit }) => {
  const {
    handleSubmit,
    register,
    watch,
    control,
    formState: { isValid }
  } = useForm<
    SelectedUserFields & {
      password: string;
    }
  >({
    defaultValues: {
      whereDidYouHearAboutUs: 'other',
      currentLevel: 'college',
      testType: 'gmat'
    }
  });

  const formValues = watch();

  const testTypes = currentLevelTestTypes[formValues.currentLevel as DifficultLevel] ?? [];

  const getValidatedTestType = (level: DifficultLevel, testType: TestType | 'no_test'): TestType => {
    if (['esl', 'toefl'].includes(testType)) return 'sat';

    if (testType === 'no_test') {
      const testTypeByLevel: Record<string, TestType> = {
        high_school: 'sat',
        college: 'gmat',
        adult: 'gmat'
      };

      return testTypeByLevel[level] || 'ssat';
    }

    return testType;
  };

  const handleFormSubmit = (fields: SubmitValues) => {
    const result = userSubmitSchema.validate(fields, { abortEarly: true });

    if (result.error) {
      return toast.error(result.error.message);
    }

    const values = result.value as SubmitValues;
    const password = values.password;

    delete values.password;

    const existingLevel = Object.keys(difficultTestTypeRelation).includes(values.currentLevel);

    // @ts-ignore
    values.difficultLevel = existingLevel ? values.currentLevel : 'adult';

    const submittedValues: SubmittedValues = {
      password,
      user: {
        ...values,
        testType: getValidatedTestType(values.difficultLevel, values.testType)
      }
    };

    onSubmit(submittedValues);
  };

  return (
    <ChakraFlex flexDirection="column" boxShadow="lg" borderRadius="lg" bgColor="white">
      <ChakraFlex alignItems="center" marginBottom="md" pt={12} px={10}>
        <ChakraFlex marginRight="xl">
          <Icon name="mind-flow-full-logo" height="40px" width="100%" />
        </ChakraFlex>

        <ChakraHeading mb={3} fontSize="2xl">
          Welcome to MindFlow
        </ChakraHeading>
      </ChakraFlex>

      {isLoading ? (
        <ChakraFlex display="flex" justifyContent="center" alignItems="center" py="lg" mb="lg">
          <ChakraSpinner speed="0.8s" color="blue.800" boxSize="50px" thickness="4px" emptyColor="gray.100" />
        </ChakraFlex>
      ) : (
        <chakra.form onSubmit={handleSubmit(handleFormSubmit)}>
          <ChakraFlex flexDirection="column" py={16} px={10}>
            <ChakraSimpleGrid columns={2} marginBottom="md" gap="md">
              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Email</ChakraFormLabel>
                <ChakraInput required type="email" name="email" ref={register} borderColor="gray.500" />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Password</ChakraFormLabel>
                <ChakraInput required type="password" name="password" ref={register} borderColor="gray.500" />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>First name</ChakraFormLabel>
                <ChakraInput required type="firstName" name="firstName" ref={register} borderColor="gray.500" />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Last name</ChakraFormLabel>
                <ChakraInput required type="lastName" name="lastName" ref={register} borderColor="gray.500" />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Phone</ChakraFormLabel>
                <Controller
                  required
                  name="phone"
                  height="40px"
                  paddingX="md"
                  border="sm"
                  borderRadius="md"
                  borderColor="gray.500"
                  transitionDuration="0.3s"
                  maskPlaceholder=""
                  mask="+9999999999999"
                  _focus={{
                    outlineColor: 'blue.500'
                  }}
                  as={MaskInput}
                  control={control}
                  disabled={isLoading}
                />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>School/Business</ChakraFormLabel>
                <ChakraInput required name="schoolName" borderColor="gray.500" ref={register} />
              </ChakraFlex>
            </ChakraSimpleGrid>

            <ChakraSimpleGrid columns={3} gap="md">
              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Exam date</ChakraFormLabel>
                <ChakraInput required type="date" name="examDate" borderColor="gray.500" ref={register} />
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Current level</ChakraFormLabel>
                <ChakraSelect
                  required
                  type="currentLevel"
                  borderColor="gray.500"
                  name="currentLevel"
                  defaultValue="college"
                  ref={register}
                >
                  <option value="" disabled>
                    Not selected
                  </option>
                  {Object.entries(currentLevelsOptions).map(([level, label]) => (
                    <option key={level} value={level}>
                      {label}
                    </option>
                  ))}
                </ChakraSelect>
              </ChakraFlex>

              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Test Type</ChakraFormLabel>
                <ChakraSelect required name="testType" borderColor="gray.500" ref={register} defaultValue="gmat">
                  <option value="no_test">No test</option>
                  {testTypes.map((test) => (
                    <option key={test} value={test}>
                      {test.toUpperCase()}
                    </option>
                  ))}
                </ChakraSelect>
              </ChakraFlex>
            </ChakraSimpleGrid>

            <ChakraText whiteSpace="nowrap" marginRight="md" color="blue.500" pt="5">
              *If your current or future program of study is not included as a choice, contact MindFlow at <br />
              <b>business@mindflowspeedreading.com</b> and we’ll recommend a study track
            </ChakraText>

            <ChakraFlex width="100%" alignItems="center" marginY="lg">
              <ChakraText whiteSpace="nowrap" marginRight="md" color="blue.500">
                Where did you hear about us?
              </ChakraText>
              <ChakraFlex width="100%" height="1px" backgroundColor="gray.500" />
            </ChakraFlex>

            <ChakraSimpleGrid columns={2} gap="md">
              <ChakraFlex flexDirection="column">
                <ChakraFormLabel>Select an option </ChakraFormLabel>
                <ChakraSelect
                  required
                  name="whereDidYouHearAboutUs"
                  borderColor="gray.500"
                  defaultValue="other"
                  ref={register}
                >
                  <option value="" disabled>
                    Not selected
                  </option>
                  {Object.entries(whereDidYouHearAboutUsOptions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </ChakraSelect>
              </ChakraFlex>

              {WHERE_DID_YOU_HEAR_ABOUT_US_DESCRIPTIVE_OPTIONS.includes(formValues.whereDidYouHearAboutUs) && (
                <ChakraFlex flexDirection="column">
                  <ChakraFormLabel>Where/Who?</ChakraFormLabel>
                  <ChakraInput
                    name="whereDidYouHearAboutUsObservation"
                    required
                    borderColor="gray.500"
                    ref={register}
                  />
                </ChakraFlex>
              )}
            </ChakraSimpleGrid>
          </ChakraFlex>

          <ChakraFlex
            py={4}
            px={10}
            borderTop="sm"
            borderColor="gray.300"
            borderBottomRadius="lg"
            bgColor="gray.100"
            justifyContent="flex-end"
            alignItems="center"
          >
            <ChakraButton variant="solid" colorScheme="blue" type="submit" isDisabled={!isValid}>
              Activate license
            </ChakraButton>
          </ChakraFlex>
        </chakra.form>
      )}
    </ChakraFlex>
  );
};
