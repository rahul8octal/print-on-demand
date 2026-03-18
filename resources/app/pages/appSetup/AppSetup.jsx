import {
    Card,
    BlockStack,
    Button,
    Text,
    Badge,
    Icon,
    InlineStack,
    InlineGrid,
    Box,
    ProgressBar,
    Tooltip,
    Banner,
    Page,
    Frame,
} from '@shopify/polaris';
import { RefreshIcon, CheckIcon, QuestionCircleIcon, NoteIcon, XIcon } from '@shopify/polaris-icons';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api';
import { useSelector } from "react-redux";
import GuideModal from "../dashboard/GuideModal";

function AppSetup() {
    const navigate = useNavigate();
    const shop = useSelector(state => state.shopStore?.shop);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [themeUrl, setThemeUrl] = useState('');
    const [addAppBlock, setAddAppBlock] = useState('');
    const [openGuideModal, setOpenGuideModal] = useState(false);
    const [guideModalType, setGuideModalType] = useState('');
    const appBlockId = process.env.MIX_SHOPIFY_API_KEY;

    const steps = [
        {
            id: 1,
            title: 'Read Tutorial',
            benefit: 'Learn how to set up your 3D models.',
            statusLabel: (data) => 'Viewed',
            isCompleted: (data) => data?.currentTab > 0 || (data?.frontEndLoginHelperEnabled),
        },
        {
            id: 2,
            title: 'Embed 3D App Block',
            benefit: 'Enable the core AR technology in your theme.',
            statusLabel: (data) => data?.frontEndLoginHelperEnabled ? 'Enabled' : 'Disabled',
            isCompleted: (data) => data?.frontEndLoginHelperEnabled,
        },
        {
            id: 3,
            title: 'Add 3D Preview Block',
            benefit: 'Show the 3D viewer button on your product pages.',
            statusLabel: (data) => data?.appPreviewBlockEnabled ? 'Added' : 'Not Added',
            isCompleted: (data) => data?.appPreviewBlockEnabled,
        },
        {
            id: 4,
            title: 'Create 3D Configuration',
            benefit: 'Personalize parts, colors, and components.',
            statusLabel: (data) => data?.productCount > 0 ? 'Configured' : 'Pending',
            isCompleted: (data) => data?.productCount > 0,
        },
    ];

    // Calculation for progress percentage
    let calculatedProgress = 0;
    if (data?.frontEndLoginHelperEnabled) calculatedProgress += 25;
    if (data?.appPreviewBlockEnabled) calculatedProgress += 25;
    if (data?.productCount > 0) calculatedProgress += 50;

    // More accurate completion count for the "X of 4 completed" text
    const completedCount = [
        (data?.currentTab > 0),
        !!data?.frontEndLoginHelperEnabled,
        !!data?.appPreviewBlockEnabled,
        (data?.productCount > 0)
    ].filter(Boolean).length;

    const progressPercentage = (completedCount / steps.length) * 100;

    const currentTab = data?.currentTab ?? 0;

    // Check if user is on free plan
    const productLimit = shop?.plan?.product_limit ?? shop?.product_limit ?? 0;

    const getData = async () => {
        try {
            setLoading(true);
            const response = await API.get('/app/dashboard');
            setData(response.data);

            const { frontEndLoginHelperEnabled, appPreviewBlockEnabled, currentTab, productCount } = response.data ?? {};

            if (!frontEndLoginHelperEnabled && currentTab !== 0) {
                postData(1);
            }
            else if (!appPreviewBlockEnabled && currentTab !== 0) {
                postData(2);
            } else if (appPreviewBlockEnabled && (currentTab === 2 || currentTab === 1 || currentTab === 3)) {
                if (productCount > 0) {
                    postData(4);
                } else {
                    postData(3);
                }
            }

        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };
    const postData = async (step) => {
        try {
            setLoading(true);

            const response = await API.post('/app/dashboard/update-current-tab', {
                current_tab: step
            });
            setData(prev => ({
                ...prev,
                currentTab: step
            }));
        } catch (e) {
            console.error('Failed to update current tab', e);
        } finally {
            setLoading(false);
        }
    };


    const handleGuideModal = (type) => {
        setGuideModalType(type);
        setOpenGuideModal(true);
        currentTab ? postData(currentTab) : postData(1);
    };

    const handleCreateARConfiguration = () => {
        navigate('/');
    };




    useEffect(() => {
        getData();
    }, []);

    useEffect(() => {
        let appId = data?.themeExtensionId;
        if (shop?.name && appId) {
            setThemeUrl(`https://${shop?.name}/admin/themes/current/editor?context=apps&activateAppId=${appId}/app-embed`);
        }
    }, [shop, data]);

    useEffect(() => {
        if (shop?.name && appBlockId) {
            setAddAppBlock(`https://${shop?.name}/admin/themes/current/editor?template=product&addAppBlockId=${appBlockId}/AR-preview&target=newAppsSection`);
        }
    }, [shop, appBlockId]);

    return (
        <Frame>
            <Page
                title="App Setup"
                primaryAction={{
                    content: 'Back to Dashboard',
                    onAction: () => navigate('/'),
                }}
            >
                <BlockStack gap="400">
                    {/* Progress and Next Action Section */}
                    <Card padding="500">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <Text variant="headingLg" as="h2">
                                        Your Setup Progress
                                    </Text>
                                    <Text variant="bodyMd" as="p" tone="subdued">
                                        {completedCount} of {steps.length} steps completed
                                    </Text>
                                </BlockStack>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        if (shop?.name) {
                                            window.open(`https://${shop.name}`, '_blank');
                                        }
                                    }}
                                >
                                    Preview on my store
                                </Button>
                            </InlineStack>

                            <ProgressBar progress={progressPercentage} size="small" tone="success" />

                            <Box paddingBlockStart="200" paddingBlockEnd="200">
                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">Activation Checklist</Text>
                                    <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                                        {[
                                            { label: 'AR block embedded in theme', completed: !!data?.frontEndLoginHelperEnabled },
                                            { label: 'AR Preview added to products', completed: !!data?.appPreviewBlockEnabled },
                                            { label: 'First product configured', completed: data?.productCount > 0 }
                                        ].map((item, idx) => (
                                            <InlineStack key={idx} gap="200" blockAlign="center">
                                                <Box
                                                    padding="050"
                                                    borderRadius="full"
                                                    background="bg-fill-subdued"
                                                >
                                                    <Icon
                                                        source={item.completed ? CheckIcon : XIcon}
                                                        tone={item.completed ? 'success' : 'subdued'}
                                                    />
                                                </Box>
                                                <Text tone={item.completed ? 'success' : 'subdued'} variant="bodySm">
                                                    {item.label}
                                                </Text>
                                            </InlineStack>
                                        ))}
                                    </InlineGrid>
                                </BlockStack>
                            </Box>
                        </BlockStack>
                    </Card>

                    <InlineStack blockAlign="center" gap="200">
                        <Button
                            variant="secondary"
                            onClick={() => getData()}
                        >
                            <InlineStack align="center" gap="200">
                                <span>Sync Setup</span>
                                <Icon source={RefreshIcon} />
                            </InlineStack>
                        </Button>
                        <Text variant="bodySm" tone="subdued">Last synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </InlineStack>

                    <BlockStack gap="400">
                        {/* Step 1 */}
                        <Card padding="500">
                            <InlineGrid columns={{ xs: '1fr', md: '2fr 180px' }} gap="600">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="300" blockAlign="center">
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '12px',
                                                backgroundColor: data?.currentTab > 0 ? 'var(--p-color-bg-fill-success-inactive)' : '#f1f1f1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: data?.currentTab > 0 ? '1px solid var(--p-color-border-success)' : '1px solid #e1e1e1'
                                            }}>
                                                <Text variant="headingMd" as="span" fontWeight="bold">1</Text>
                                            </div>
                                            <Text variant="headingMd" as="h3">Getting Started with AR 3D</Text>
                                        </InlineStack>
                                        <Badge tone={data?.currentTab > 0 ? "success" : "attention"}>
                                            {data?.currentTab > 0 ? "Completed" : "Required"}
                                        </Badge>
                                    </InlineStack>

                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Learn how to attach 3D images to products and set up configurable parts for an immersive customer experience.
                                        </Text>
                                        <InlineStack gap="400" blockAlign="center">
                                            <InlineStack gap="100" blockAlign="center">
                                                <Icon source={NoteIcon} tone="subdued" />
                                                <Text variant="bodySm" tone="subdued">Clear setup guidance</Text>
                                            </InlineStack>
                                        </InlineStack>
                                    </BlockStack>

                                    <Box paddingBlockStart="200">
                                        <Button onClick={() => handleGuideModal('front-login')} size="large">
                                            Watch Tutorial
                                        </Button>
                                    </Box>
                                </BlockStack>
                                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                    <img
                                        src="/images/tutorial-image-200.png"
                                        alt="Tutorial"
                                        style={{ width: '100px', height: '100px', borderRadius: '8px' }}
                                    />
                                </Box>
                            </InlineGrid>
                        </Card>

                        {/* Step 2 */}
                        <Card padding="500">
                            <InlineGrid columns={{ xs: '1fr', md: '2fr 180px' }} gap="600">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="300" blockAlign="center">
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '12px',
                                                backgroundColor: data?.frontEndLoginHelperEnabled ? 'var(--p-color-bg-fill-success-inactive)' : '#f1f1f1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: data?.frontEndLoginHelperEnabled ? '1px solid var(--p-color-border-success)' : '1px solid #e1e1e1'
                                            }}>
                                                <Text variant="headingMd" as="span" fontWeight="bold">2</Text>
                                            </div>
                                            <Text variant="headingMd" as="h3">Embed AR App Block</Text>
                                        </InlineStack>
                                        <Badge tone={data?.frontEndLoginHelperEnabled ? 'success' : 'attention'}>
                                            {data?.frontEndLoginHelperEnabled ? 'Enabled' : 'Required'}
                                        </Badge>
                                    </InlineStack>

                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Enable the AR App block embed in your theme to power the 3D engine on your store.
                                        </Text>
                                        <InlineStack gap="400" blockAlign="center">
                                            <Tooltip content="The AR engine needs to be active in your theme to render 3D models.">
                                                <InlineStack gap="100" blockAlign="center">
                                                    <Icon source={QuestionCircleIcon} tone="subdued" />
                                                    <Text variant="bodySm" tone="subdued">Why is this needed?</Text>
                                                </InlineStack>
                                            </Tooltip>
                                        </InlineStack>
                                    </BlockStack>

                                    <Box paddingBlockStart="200">
                                        {!data?.frontEndLoginHelperEnabled ? (
                                            <Button variant="primary" onClick={() => themeUrl && window.open(themeUrl, '_blank')} loading={loading} size="large">
                                                Enable in Theme
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" onClick={() => themeUrl && window.open(themeUrl, '_blank')} size="large"
                                                disabled={data?.frontEndLoginHelperEnabled || data?.currentTab == 0}>
                                                Theme Settings
                                            </Button>
                                        )}
                                    </Box>
                                </BlockStack>
                                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                    <img
                                        src="/images/app_embeded.png"
                                        alt="App Embed"
                                        style={{ width: '170px', height: '120px', borderRadius: '8px', objectFit: 'cover' }}
                                    />
                                </Box>
                            </InlineGrid>
                        </Card>

                        {/* Step 3 */}
                        <Card padding="500">
                            <InlineGrid columns={{ xs: '1fr', md: '2fr 180px' }} gap="600">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="300" blockAlign="center">
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '12px',
                                                backgroundColor: data?.appPreviewBlockEnabled ? 'var(--p-color-bg-fill-success-inactive)' : '#f1f1f1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: data?.appPreviewBlockEnabled ? '1px solid var(--p-color-border-success)' : '1px solid #e1e1e1'
                                            }}>
                                                <Text variant="headingMd" as="span" fontWeight="bold">3</Text>
                                            </div>
                                            <Text variant="headingMd" as="h3">Add AR Preview Block</Text>
                                        </InlineStack>
                                        <Badge tone={data?.appPreviewBlockEnabled ? 'success' : 'attention'}>
                                            {data?.appPreviewBlockEnabled ? 'Added' : 'Required'}
                                        </Badge>
                                    </InlineStack>

                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Add the "AR Preview" block to your product pages template so customers can see it in action.
                                        </Text>
                                        <InlineStack gap="400" blockAlign="center">
                                            <Text variant="bodySm" tone="subdued">•</Text>
                                            <Text variant="bodySm" tone="subdued">Benefit: Customer-facing viewer</Text>
                                        </InlineStack>
                                    </BlockStack>

                                    <Box paddingBlockStart="200">
                                        {data?.frontEndLoginHelperEnabled && (
                                            <Button
                                                variant={!data?.appPreviewBlockEnabled ? "primary" : "secondary"}
                                                onClick={() => addAppBlock && window.open(addAppBlock, '_blank')}
                                                loading={loading}
                                                disabled={!data?.frontEndLoginHelperEnabled || data?.appPreviewBlockEnabled}
                                                size="large"
                                            >
                                                {data?.appPreviewBlockEnabled ? 'Go to Editor' : 'Add Block to Theme'}
                                            </Button>
                                        )}
                                        {data?.appPreviewBlockEnabled && (
                                            <Box paddingBlockStart="200">
                                                <Banner tone="success">
                                                    <p>AR preview added successfully!</p>
                                                </Banner>
                                            </Box>
                                        )}
                                    </Box>
                                </BlockStack>
                                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                    <img
                                        src="/images/try_on.png"
                                        alt="Preview Block"
                                        style={{ width: '135px', height: '190px', borderRadius: '8px', objectFit: 'contain' }}
                                    />
                                </Box>
                            </InlineGrid>
                        </Card>

                        {/* Step 4 */}
                        <Card padding="500">
                            <InlineGrid columns={{ xs: '1fr', md: '2fr 180px' }} gap="600">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="300" blockAlign="center">
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '12px',
                                                backgroundColor: data?.productCount > 0 ? 'var(--p-color-bg-fill-success-inactive)' : '#f1f1f1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: data?.productCount > 0 ? '1px solid var(--p-color-border-success)' : '1px solid #e1e1e1'
                                            }}>
                                                <Text variant="headingMd" as="span" fontWeight="bold">4</Text>
                                            </div>
                                            <Text variant="headingMd" as="h3">Create 3D Configuration</Text>
                                        </InlineStack>
                                        <Badge tone={data?.productCount > 0 ? 'success' : 'attention'}>
                                            {data?.productCount > 0 ? 'Completed' : 'Next Step'}
                                        </Badge>
                                    </InlineStack>

                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Final step: Let customers preview products in AR before buying. Attach 3D visuals to your products.
                                        </Text>
                                        <InlineStack gap="400" blockAlign="center">
                                            <Text variant="bodySm" tone="subdued">•</Text>
                                            <Text variant="bodySm" tone="subdued">Benefit: Drive higher conversion</Text>
                                        </InlineStack>
                                    </BlockStack>

                                    <Box paddingBlockStart="200">
                                        <Button
                                            variant={(data?.appPreviewBlockEnabled && data?.productCount === 0) ? "primary" : "secondary"}
                                            onClick={() => handleCreateARConfiguration()}
                                            disabled={!data?.appPreviewBlockEnabled}
                                            size="large"
                                        >
                                            Create 3D Configuration
                                        </Button>
                                    </Box>
                                </BlockStack>
                                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                    <img
                                        src="/images/AR-app-banner.png"
                                        alt="Configuration"
                                        style={{ width: '150px', height: '120px', borderRadius: '8px', objectFit: 'contain' }}
                                    />
                                </Box>
                            </InlineGrid>
                        </Card>
                    </BlockStack>
                </BlockStack>

                {openGuideModal &&
                    <GuideModal
                        openGuideModal={openGuideModal}
                        setOpenGuideModal={setOpenGuideModal}
                        guideModalType={guideModalType}
                        themeUrl={themeUrl}
                    />
                }
            </Page>
        </Frame>
    );
}

export default AppSetup;
