import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "../components/Index"
import {useAppBridge} from "@shopify/app-bridge-react";
import {onLCP} from 'web-vitals';
import { useSelector } from "react-redux";
import { useEffect } from "react";

function App() {

    const shopify = useAppBridge();
    const navigate = useNavigate();
    const location = useLocation();
    const { shop, status } = useSelector((state) => state.shopStore);

    const queue = new Set();
    function addToQueue(metric) {
        queue.add(metric);
    }

    function flushQueue() {

        if (queue.size > 0) {

            let body = {
                shop: shopify.config.shop,
                path: window.location.pathname,
                metrics: [],
            };
            queue.forEach((item) => {

                if (item.name === 'LCP') {

                    const elements = [];
                    item.entries.forEach((entry) => {
                        if (entry?.element?.outerHTML) {
                            elements.push(entry.element.outerHTML);
                        }
                    });

                    item.elements = elements;
                }

                body.metrics.push(item);
            });

            navigator.sendBeacon('/web-vitals', JSON.stringify(body));

            queue.clear();
        }
    }

    onLCP(addToQueue);

    addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushQueue();
        }
    });

    window.axios.interceptors.request.use(async (config) => {
        try {
            let token = await shopify.idToken();
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
        } catch (e) {
            console.error('Failed to load session token', e);
        }
    });

    useEffect(() => {
        if (status === 'successful') {
            if (!shop?.plan && location.pathname !== '/plans' && location.pathname !== '/plans/') {
                navigate('/plans');
            }
        }
    }, [status, shop, location, navigate]);

    return (
        <div className="app-section">
            { (status !== 'successful' || shop?.plan) && <Navigation /> }
            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}
export default App;
