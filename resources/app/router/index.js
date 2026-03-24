import { createBrowserRouter } from "react-router-dom";

import Main from "../layouts/Main";
import App from "../layouts/App";
import Dashboard from "../pages/dashboard/Dashboard";
import Settings from "../pages/settings/Settings";
import { PageNotFound } from "../components/Index";
import Plans from "../pages/plans/Plans";
import AppSetup from '../pages/appSetup/AppSetup';
import Products from '../pages/products/Products';

const routes = [
    {
        path: '/',
        element: <Main />,
        children: [
            {
                path: '',
                element: <App />,
                children: [
                    {
                        path: '',
                        element: <Dashboard />
                    },
                    {
                        path: 'app-setup',
                        element: <AppSetup />,
                    },
                    {
                        path: 'products',
                        element: <Products />,
                    },
                    {
                        path: 'settings/:tab',
                        element: <Settings />,
                    },
                    {
                        path: 'plans',
                        element: <Plans />,
                    },
                ]
            },
            {
                path: '/*',
                element: <PageNotFound />
            }
        ]
    },
];

const router = createBrowserRouter(routes);

export { router, routes };
