import { NavMenu } from "@shopify/app-bridge-react";
import {useLocation} from "react-router-dom";

const Navigation = (props) => {

    const location = useLocation();

    const DASHBOARD = '/';
    const APP_SETUP = '/app-setup';
    const PLANS = '/plans';

    const navigation = [
        {
            label: 'Dashboard',
            destination: DASHBOARD,
        },
        {
            label: 'POD Catalog',
            destination: '/products',
        },
        {
            label: 'App Setup',
            destination: APP_SETUP,
        },
        {
            label: 'Plans',
            destination: PLANS,
        },
    ];

    return (
        <NavMenu key={location.pathname}>
            {navigation.map((navItem, navIndex) => (
                <a key={navIndex} href={navItem.destination} rel={navItem.label}>
                    {navItem.label}
                </a>
            ))}
        </NavMenu>
    );
};

export default Navigation;
