import React, { FC } from 'react';

import { Route } from 'react-router';
import { Switch, useLocation } from 'react-router-dom';

import { useAuthContext } from 'lib/firebase';

import { BusinessLayout } from 'layouts/Business';
import { MainLayout } from 'layouts/Main';
import { OwnerLayout } from 'layouts/Owner';
import { PublicLayout } from 'layouts/Public';
import { ReportsLayout } from 'layouts/Reports';

import { businessRoutes } from './business/routes';
import { mainRoutes } from './main/routes';
import { ownerReportsRoutes } from './ownerReports/routes';
import { ownerRoutes } from './owner/routes';
import publicRoutes from './public/routes';
import { PublicNewLayout } from 'layouts/PublicNew';

export const PagesRouter: FC = (authoredProps) => {
  const { user } = useAuthContext();
  const { pathname } = useLocation();

  const renderRoute = (route: any) => {
    const { Component, path, exact } = route;

    return (
      <Route
        key={path}
        path={path}
        exact={exact}
        render={() => <Component key={document.location.href} {...authoredProps} />}
      />
    );
  };

  if (pathname.startsWith('/free/program') || pathname.startsWith('/free/buy-program')) {
    return (
      <PublicNewLayout>
        <Switch>{publicRoutes.map(renderRoute)}</Switch>
      </PublicNewLayout>
    );
  }

  if (pathname.startsWith('/free')) {
    return (
      <PublicLayout>
        <Switch>{publicRoutes.map(renderRoute)}</Switch>
      </PublicLayout>
    );
  }
  if (!user) return null;

  if (pathname.startsWith('/owner')) {
    return (
      <OwnerLayout>
        <Switch>{ownerRoutes.map(renderRoute)}</Switch>
      </OwnerLayout>
    );
  }
  if (pathname.startsWith('/reports')) {
    return (
      <ReportsLayout>
        <Switch>{ownerReportsRoutes.map(renderRoute)}</Switch>
      </ReportsLayout>
    );
  }

  if (pathname.startsWith('/business')) {
    return <Switch>{businessRoutes.map(renderRoute)}</Switch>;
  }

  return (
    <MainLayout {...authoredProps}>
      <Switch>{mainRoutes.map(renderRoute)}</Switch>
    </MainLayout>
  );
};
