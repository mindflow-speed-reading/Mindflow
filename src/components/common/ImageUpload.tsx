import React, { FC, useRef, useState } from 'react';

import {
  Flex as ChakraFlex,
  FlexProps as ChakraFlexProps,
  Heading as ChakraHeading,
  Image as ChakraImage,
  Text as ChakraText,
  Spinner
} from '@chakra-ui/react';

import { useFirebaseContext } from 'lib/firebase';

export interface ImageUploadProps extends Omit<ChakraFlexProps, 'onChange'> {
  value?: string;
  imageName?: string;
  onChange: (imageUrl: string) => void;
}

export const ImageUpload: FC<ImageUploadProps> = ({ value, imageName, onChange, ...rest }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { storage } = useFirebaseContext();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    let imageRef: string | undefined;

    if (file) {
      setIsLoading(true);

      const uploadTask = storage.ref(`/pictures/${imageName || file?.name}`).put(file);

      uploadTask.on(
        'state_changed',
        () => null,
        () => null,
        () => {
          storage
            .ref('pictures')
            .child(imageName || file.name)
            .getDownloadURL()
            .then((fireBaseUrl) => {
              onChange(fireBaseUrl);
              setIsLoading(false);
            });
        }
      );

      return imageRef;
    }
  };

  return (
    <ChakraFlex
      width="100%"
      height="100%"
      border="sm"
      cursor="pointer"
      overflow="hidden"
      background="gray.100"
      borderColor="gray.300"
      borderStyle="dashed"
      borderRadius="sm"
      alignItems="center"
      justifyContent="center"
      transitionDuration="0.3s"
      _hover={{ background: 'gray.200' }}
      onClick={() => inputRef.current?.click()}
      {...rest}
    >
      {isLoading ? (
        <Spinner thickness="2px" speed="0.8s" emptyColor="gray.100" color="blue.800" />
      ) : (
        <>
          {value ? (
            <ChakraImage width="100%" height="100%" objectFit="cover" src={value} />
          ) : (
            <ChakraFlex width="100%" justifyContent="center" alignItems="center" flexDirection="column" padding="md">
              <ChakraHeading marginBottom="xs" fontSize="xl">
                Upload an image
              </ChakraHeading>
              <ChakraText>Choose a file to upload as a image.</ChakraText>
            </ChakraFlex>
          )}
          <input
            hidden
            type="file"
            accept=".jpg,.jpeg,.png"
            ref={inputRef}
            onChange={({ target }) => target.files && handleImageUpload(target?.files[0])}
          />
        </>
      )}
    </ChakraFlex>
  );
};
