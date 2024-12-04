import React from 'react';

import { BrowserRouter, Switch } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Route } from 'react-router';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import 'typeface-montserrat';
import 'typeface-roboto';

import { AuthProvider } from './lib/firebase/AuthProvider';
import { FirebaseProvider } from './lib/firebase/FirebaseProvider/FirebaseProvider';

import { ActivateExistingLicense } from 'pages/activateExistingLicense';
import { ActivateLicense } from 'pages/activateLicense';
import { BetaSignUp } from 'pages/beta';
import { BusinessPurchaseAdditionalLicenses } from 'pages/businessPurchaseAdditionalLicenses';
import { LoginPage } from 'pages/login';
import { PagesRouter } from 'pages/router';
import { ResetPassword } from 'pages/resetPassword';

import { PencilLoginPage } from 'pages/PencilLoginPage';
import { BusinessDiscount } from 'pages/businessDiscount';
import { BusinessDiscountCallback } from 'pages/businessDiscountCallback';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import theme from 'theme';
const queryClient = new QueryClient();

function App() {
  const paypalOptions = {
    'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID ?? '',
    currency: 'USD',
    components: 'buttons'
  };

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_RECAPTCHA_KEY}>
      <PayPalScriptProvider options={paypalOptions}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <ChakraProvider theme={theme}>
            <BrowserRouter>
              <FirebaseProvider>
                <Switch>
                  <Route path="/activate-purchased-license/:provider/:orderId" component={ActivateLicense} />
                  <Route
                    path="/additional-purchased-license/:provider/:orderId/:businessId/:quantity"
                    component={BusinessPurchaseAdditionalLicenses}
                  />
                  <Route path="/activate-license/:licenseId" component={ActivateExistingLicense} />

                  <Route path="/business-discount" component={BusinessDiscount} exact={true} />
                  <Route
                    path="/business-discount/callback/:provider/:orderId/:id"
                    component={BusinessDiscountCallback}
                  />

                  <Route path="/beta-sign-up" component={BetaSignUp} />
                  <Route path="/reset-password/:code" component={ResetPassword} />

                  <AuthProvider>
                    <Route path="/login" component={LoginPage} />
                    <Route path="/pencilSpacesLogin" component={PencilLoginPage} />
                    <PagesRouter />
                  </AuthProvider>
                </Switch>
              </FirebaseProvider>
            </BrowserRouter>
          </ChakraProvider>
          <ToastContainer />
        </QueryClientProvider>
      </PayPalScriptProvider>
    </GoogleReCaptchaProvider>
  );
}

export default App;
