import React, { FC, useEffect } from 'react';

import { auth } from 'firebase';
import { Flex } from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useHistory, useLocation, useParams } from 'react-router';
import { useMutation } from 'react-query';
import axios from 'axios';

import { ActivateLicenseForm } from 'components/Pages/Generic';

import { useRandomImage } from 'lib/firebase';

import { UserDetails } from 'types';

export const ActivateLicense: FC = () => {
  const { orderId, provider } = useParams<{ orderId: string; provider: string }>();
  const { push, replace } = useHistory();

  const location = useLocation();

 const { mutate: activateLicense, isLoading } = useMutation<any>(
    ['activateLicense'],
    // @ts-ignore
    async (values: Record<string, any>) => {
      // await axios.post<UserDetails>(` http://127.0.0.1:5001/mindflow-local/us-central1/api/activateSoldLicense`, {
       await axios.post<UserDetails>(`${process.env.REACT_APP_CLOUD_FUNCTIONS_URL}/activateSoldLicense`, {
        user: values.user,
        password: values.password,
        provider,
        orderId,
      });
      
      await auth().signInWithEmailAndPassword(values.user.email, values.password);

      toast.success('Welcome to MindFlow');

      push('/');
    },
    {
      onError(e) {
        // @ts-ignore
        toast.error(e?.response?.data?.message ?? 'Unknown error');
      }
    }
  );

  const [imageUrl] = useRandomImage();

  const onSubmit = (fields: any) => {
    activateLicense(fields);
  };

  const handleSendReceipt = async () => {
    await axios.post(`${process.env.REACT_APP_CLOUD_FUNCTIONS_URL}/sendLicenseOrderReceipt`, {
    // await axios.post(`http://127.0.0.1:5001/mindflow-local/us-central1/api/sendLicenseOrderReceipt`, {
      orderId,
      provider,
      quantity: 1,
    });
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const redirected = queryParams.get('redirected');
    const appliedCoupon = queryParams.get('coupon');

    if (redirected) {
      handleSendReceipt();
    }

    queryParams.delete('redirected');

    replace({
      search: queryParams.toString()
    });
  }, []);

  return (
    <Flex
      minH="100vh"
      minW="100vw"
      justifyContent="center"
      alignItems="center"
      bg="linear-gradient(to right, #2c3e50, #bdc3c7)"
      bgImage={imageUrl ? `url(${imageUrl})` : ''}
      bgSize="100%"
    >
      <ActivateLicenseForm isLoading={isLoading} onSubmit={onSubmit} />
    </Flex>
  );
};
