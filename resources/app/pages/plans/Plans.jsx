import {
    BlockStack, Box,
    Button,
    Card,
    Divider,
    Icon,
    InlineStack,
    Page,
    Text,
    SkeletonPage,
    Layout,
    LegacyCard,
    SkeletonBodyText,
    TextContainer,
    SkeletonDisplayText, Grid, Modal, DataTable,
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import {
    CheckIcon,
    XIcon,
    AlertTriangleIcon
} from "@shopify/polaris-icons";
import { API } from "../../api";
import { useSelector } from "react-redux";
import PlanInfo from "./PlanInfo";
import { FEATURES } from "../../constants";
import { useAppBridge } from "@shopify/app-bridge-react";

function Plans() {

    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState([]);
    const [devPlan, setDevPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const shopify = useAppBridge();
    const shop = useSelector(state => state.shopStore?.shop);

    const getPlans = async () => {
        try {
            setLoading(true);
            setPageLoading(true);
            const response = await API.get('/app/plans');
            const plans = response.data?.plans || [];
            const currentPlanData = response.data?.plan;
            const filteredPlans = plans.filter(plan => {
                if (plan.slug === 'pro-old') {
                    return currentPlanData?.slug === 'pro-old';
                }
                return true;
            });

            setPlans(filteredPlans);
            setDevPlans(plans?.[1] || []);
            setCurrentPlan(currentPlanData);
        } catch (e) {
            console.error('Failed to fetch plans', e);
        } finally {
            setLoading(false);
            setPageLoading(false);
        }
    };

    const createCharge = async (plan, index) => {
        setLoading(true);
        setCurrentIndex(index);

        const shopName = shopify?.config?.shop || shop?.name;
        const host = shopify?.config?.host;

        if (plan.slug === 'free') {
            const uniqueChargeId = `${shop.id}000${Math.floor(Date.now() / 1000)}`;
            window.top.location.href = `/billing/process/${plan.id}?shop=${shopName}&host=${host}&charge_id=${uniqueChargeId}`;
            return;
        }

        try {
            const response = await API.get(`/billing/${plan.id}?shop=${shopName}&host=${host}`);
            if (response.data && response.data.url) {
                window.top.location.href = response.data.url;
            } else {
                if (response.data.errors && response.data.errors.length > 0) {
                    alert('Shopify Error: ' + response.data.errors.map(e => e.message).join(', '));
                }
                setLoading(false);
            }
        } catch (e) {
            setLoading(false);
        }
    }

    const completeOnboarding = async () => {
        if (shop?.onboarding) return;

        try {
            await API.get(`/app/plans/onboard`);
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        getPlans();
        completeOnboarding();
    }, []);

    const getDiscountPrice = (plan) => {
        let discountAmount = plan.discount?.amount || 0;
        let price = plan.price;
        if (discountAmount) {
            price = plan.price - discountAmount;
        }
        return Number(price).toFixed(2).replace(/\.00$/, '');
    }

    const buildFeatureDisplay = (plan, feature) => {


        if (feature.type === 'bool') {
            return {
                valueNode: <Icon source={feature.value ? CheckIcon : XIcon} />,
                label: feature.name,
            };
        }

        return {
            valueNode: <Text as="span" variant="bodyLg">{feature.value}</Text>,
            // label: feature.name,
        };
    };

    return (
        <Page title={shop?.development_store ? 'Plans' : 'Plans'}>
            {pageLoading ? (
                <SkeletonPage primaryAction={false}>
                    <Layout>
                        <Layout.Section>
                            <LegacyCard sectioned>
                                <TextContainer>
                                    <SkeletonDisplayText size="small" />
                                    <SkeletonBodyText />
                                </TextContainer>
                            </LegacyCard>
                        </Layout.Section>
                    </Layout>
                </SkeletonPage>
            ) : (
                <BlockStack gap="400">
                    <Grid gap="400" columns={plans.length >= 3 ? 3 : 2}>
                        {plans.map((plan, index) => (
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: plans.length >= 3 ? 4 : 6, xl: plans.length >= 3 ? 4 : 6 }} key={index}>
                                <Card key={index}>
                                    <BlockStack gap="600">
                                        <BlockStack gap="200">
                                            <Text as="h2" variant="headingLg">
                                                {plan.name}
                                            </Text>
                                            <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
                                                {plan.description}
                                            </Text>
                                        </BlockStack>
                                        <BlockStack gap="300">
                                            <BlockStack>
                                                <InlineStack gap="100" blockAlign="baseline">
                                                    {plan.discount?.amount ?
                                                        <>
                                                            <span style={{ textDecoration: 'line-through' }}>
                                                                <Text as="h5" className="strikethrough" fontWeight="medium" tone="subdued" variant="headingXl">
                                                                    ${Number(plan.price).toFixed(2).replace(/\.00$/, '')}
                                                                </Text>
                                                            </span>
                                                            <Text as="h2" variant="heading2xl">
                                                                ${getDiscountPrice(plan)}
                                                            </Text>
                                                        </> :
                                                        <Text as="h2" variant="heading2xl">
                                                            ${getDiscountPrice(plan)}
                                                        </Text>
                                                    }
                                                    <Text as="span" variant="bodyLg" tone="subdued">
                                                        /month
                                                    </Text>
                                                </InlineStack>
                                                {plan.capped_amount ? <Text as="span" variant="bodyLg" tone="subdued">
                                                    $0.001/invite after limit (capped at $50/month)
                                                </Text> : ''}

                                            </BlockStack>
                                            <Divider />
                                            <BlockStack gap="300">
                                                {plan.features
                                                    ?.slice()
                                                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                                    .map((feature, featureIndex) => {
                                                        if (!feature.value || feature.hidden_feature || feature.hidden_feature === 1 || feature.hidden_feature === '1' || feature.slug === '2d-3d-generation-limit') return null;
                                                        return (
                                                            <div style={feature.slug === FEATURES.MULTIPASS_LOGIN && !shop?.shopify_plus && !shop?.development_store ? { display: 'none' } : {}} key={featureIndex}>
                                                                {(() => {
                                                                    const { valueNode, label } = buildFeatureDisplay(plan, feature);
                                                                    return (
                                                                        <InlineStack key={featureIndex} gap="200" align="start" blockAlign="center">
                                                                            <div style={{ minWidth: '20px' }}>
                                                                                {valueNode}
                                                                            </div>
                                                                            <Text as="span" variant="bodyMd">
                                                                                {label}
                                                                            </Text>
                                                                        </InlineStack>
                                                                    );
                                                                })()}
                                                            </div>
                                                        );
                                                    })}
                                            </BlockStack>
                                        </BlockStack>
                                        <BlockStack gap="300">
                                            <Divider />
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    createCharge(plan, index)
                                                }}
                                                loading={loading && currentIndex == index}
                                                disabled={plan.id == currentPlan?.id || (loading && currentIndex == index)}
                                                accessibilityLabel={`Select ${plan.name} Plan`}
                                                fullWidth
                                                size="large"
                                            >
                                                {plan.id == currentPlan?.id
                                                    ? 'Current Plan'
                                                    : (currentPlan?.id ? 'Change Plan' : 'Select Plan')}
                                            </Button>
                                        </BlockStack>
                                    </BlockStack>
                                </Card>
                            </Grid.Cell>
                        ))}
                    </Grid>

                </BlockStack>
            )}

            <div style={{ TextAlign: "center", padding: "15px" }}>
                <Text as="p" alignment="center">Build with ❤️ by Octilo APP, ©2026.</Text>
            </div>

        </Page>
    );
}
export default Plans;
