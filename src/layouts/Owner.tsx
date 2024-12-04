import React, { FC, useEffect, useState } from 'react';

import {
  Flex as ChakraFlex,
  Heading as ChakraHeading,
  Tab as ChakraTab,
  TabList as ChakraTabList,
  Tabs as ChakraTabs,
  Text as ChakraText
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';

import { FiltersFormProvider } from 'components/Pages/Owner/FiltersFormProvider';
import { Icon } from 'components/common';
import { OwnerContextProvider } from 'components/Pages/Owner';
import { ownerRoutes } from 'pages/owner/routes';
import { Header, Sidebar, SidebarRouteItem } from 'components/layout';
import { useLicenses } from 'lib/customHooks';

export const OwnerLayout: FC = ({ children, ...props }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { isOwner, isBusinessOwner } = useLicenses();

  const router = useHistory();

  const routes: SidebarRouteItem[] = [{ path: '/', icon: 'home', label: 'Dashboard' }];

  useEffect(() => {
    if (!isOwner ) {
      toast.error('You are not authorized to access this page.');
      router.push('/');
    }
  }, [isOwner]);

  return (
    <ChakraFlex width="100%" height="100vh">
      <Sidebar routes={routes} isCollapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
      <ChakraFlex width="100%" height="100%" padding="xl" gridGap="xl" overflow="auto" flexDirection="column">
        <Header />
        <ChakraFlex minW="90%" maxW="100%" flexDir="column">
          <ChakraTabs width="100%" variant="unstyled" my="md">
            <ChakraFlex flexDirection={{ md: 'column', lg: 'row' }} justifyContent="space-between">
              <ChakraFlex marginRight={{ lg: 'lg' }} marginBottom={{ sm: 'md' }} flex="1" alignItems="center">
                <ChakraHeading marginRight="md" fontSize="3xl" fontWeight="bold" color="blue.500" whiteSpace="nowrap">
                  Owner Dashboard
                </ChakraHeading>
              </ChakraFlex>
              <ChakraTabList
                isTruncated
                flex="2.5"
                minHeight="68px"
                overflow="hidden"
                boxShadow="lg"
                borderRadius="sm"
                justifyContent="space-between"
              >
                {ownerRoutes.map(({ path, label }) => {
                  // Means it is a dynamic route
                  if (path.includes(':')) return null;

                  return (
                    <ChakraTab
                      isTruncated
                      width="100%"
                      fontWeight="bold"
                      key={path}
                      _selected={{
                        color: 'blue.500',
                        background: 'rgba(5, 49, 74, 0.1)'
                      }}
                      onClick={() => router.push(path)}
                    >
                      <ChakraText isTruncated>{label}</ChakraText>
                    </ChakraTab>
                  );
                })}
              </ChakraTabList>
            </ChakraFlex>
          </ChakraTabs>
          <FiltersFormProvider>
            <OwnerContextProvider>
              {React.Children.map(children, (child: any) => React.cloneElement(child, { ...props }))}
            </OwnerContextProvider>
          </FiltersFormProvider>
        </ChakraFlex>
      </ChakraFlex>
    </ChakraFlex>
  );
};
