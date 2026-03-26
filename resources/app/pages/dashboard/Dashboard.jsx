import {
    Page,
    Card,
    BlockStack,
    Button,
    Text,
    Spinner,
    IndexTable,
    Badge,
    Layout,
    Thumbnail,
    InlineStack,
    Box,
    Grid,
    Link,
    Icon,
    Modal,
    Tabs
} from '@shopify/polaris';
import { ExternalIcon, StoreIcon, ViewIcon, ArrowRightIcon, ArrowLeftIcon } from '@shopify/polaris-icons';
import React, { useState, useEffect } from 'react';
import { API } from '../../api';
import { useSelector } from "react-redux";

export default function Dashboard() {
    const shop = useSelector(state => state.shopStore?.shop);
    const [loading, setLoading] = useState(true);
    const [designs, setDesigns] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [activeSide, setActiveSide] = useState('front');
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    
    const fetchDesigns = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/app/shops/designs');
            if (data?.data?.data) {
                setDesigns(data.data.data);
            } else if (data?.data) {
                setDesigns(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch POD designs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDesigns();
    }, []);

    const handlePreviewClick = async (id) => {
        try {
            setIsFetchingDetail(true);
            const { data } = await API.get(`/app/shops/designs/${id}`);
            if (data.success) {
                setSelectedDesign(data.design);
                setPreviewImage(data.design.design_image_url);
                setActiveSide('front');
            }
        } catch (e) {
            console.error('Failed to fetch design detail', e);
        } finally {
            setIsFetchingDetail(false);
        }
    };

    const currentSidePreview = selectedDesign?.design_data?.designs?.[activeSide]?.preview || selectedDesign?.design_image_url;

    return (
        <Page title="POD Dashboard" fullWidth primaryAction={{ content: 'Refresh Data', onAction: fetchDesigns }}>
            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        <Card padding="500">
                            <BlockStack gap="500">
                                <InlineStack align="space-between" blockAlign="center">
                                    <BlockStack gap="100">
                                        <Text variant="headingLg" as="h2">Print On Demand System Live 🚀</Text>
                                        <Text tone="subdued">Monitor custom designs generated via your Storefront correctly pushed to your Print Provider.</Text>
                                    </BlockStack>
                                    <Button 
                                      icon={StoreIcon} 
                                      onClick={() => shop?.name && window.open(`https://${shop.name}`, '_blank')}
                                    >
                                      Visit Custom Storefront
                                    </Button>
                                </InlineStack>

                                <Grid>
                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4 }}>
                                        <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                            <BlockStack gap="100">
                                                <Text variant="bodySm" tone="subdued">Total Custom Designs Captured</Text>
                                                <Text variant="headingLg">{designs.length || 0}</Text>
                                            </BlockStack>
                                        </Box>
                                    </Grid.Cell>
                                </Grid>
                            </BlockStack>
                        </Card>

                        <Card padding="0">
                            {loading ? (
                                <Box padding="1000">
                                    <InlineStack align="center"><Spinner size="large" /></InlineStack>
                                </Box>
                            ) : designs.length === 0 ? (
                                <Box padding="800">
                                    <BlockStack align="center" inlineAlign="center" gap="200">
                                        <Text variant="headingMd">No Designs Generated Yet</Text>
                                        <Text tone="subdued">Direct customers to the storefront designer to initiate the flow.</Text>
                                    </BlockStack>
                                </Box>
                            ) : (
                                <IndexTable
                                    resourceName={{ singular: 'design', plural: 'designs' }}
                                    itemCount={designs.length}
                                    selectable={false}
                                    headings={[
                                        { title: 'Print Ready Output' },
                                        { title: 'Linked Shopify Product' },
                                        { title: 'Actions' }
                                    ]}
                                >
                                    {designs.map((design, index) => (
                                        <IndexTable.Row id={design.id} key={design.id} position={index}>
                                            <IndexTable.Cell>
                                                <InlineStack gap="300" blockAlign="center" padding="200">
                                                    <Thumbnail source={design.design_image_url} alt="Custom POD Design" size="large" />
                                                </InlineStack>
                                            </IndexTable.Cell>
                                            <IndexTable.Cell>
                                                <Text variant="bodyMd" fontWeight="bold">ID: {design.product_id}</Text>
                                            </IndexTable.Cell>
                                            <IndexTable.Cell>
                                                <InlineStack gap="200" blockAlign="center">
                                                    <Button
                                                        size="slim"
                                                        icon={ViewIcon}
                                                        loading={isFetchingDetail && selectedDesign?.id === design.id}
                                                        onClick={() => handlePreviewClick(design.id)}
                                                    >
                                                        Preview
                                                    </Button>
                                                    <Button 
                                                        size="slim" 
                                                        variant="tertiary"
                                                        onClick={async () => {
                                                            try {
                                                                const { data } = await API.get(`/app/shops/designs/${design.id}/token`);
                                                                if (data.success && data.endpoint) {
                                                                    const appUrl = process.env.MIX_APP_URL || process.env.APP_URL || '';
                                                                    const url = `${appUrl}${data.endpoint}`;
                                                                    window.open(url, '_blank');
                                                                }
                                                            } catch (err) {
                                                                console.error("Preparation failed", err);
                                                            }
                                                        }}
                                                    >
                                                        <InlineStack gap="100" blockAlign="center">
                                                            <span>Download Print Assets (ZIP)</span>
                                                            <Icon source={ExternalIcon} />
                                                        </InlineStack>
                                                    </Button>
                                                </InlineStack>
                                            </IndexTable.Cell>
                                        </IndexTable.Row>
                                    ))}
                                </IndexTable>
                            )}
                        </Card>
                    </BlockStack>
                </Layout.Section>
            </Layout>

            <Modal
                open={!!selectedDesign}
                onClose={() => {
                    setPreviewImage(null);
                    setSelectedDesign(null);
                }}
                title="Design Preview"
                primaryAction={{
                    content: 'Close',
                    onAction: () => setSelectedDesign(null),
                }}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        {selectedDesign?.design_data?.designs?.back && (
                            <InlineStack align="center" gap="400">
                                <Button 
                                    icon={ArrowLeftIcon} 
                                    disabled={activeSide === 'front'}
                                    onClick={() => setActiveSide('front')}
                                >
                                    Front View
                                </Button>
                                <Badge tone="info">{activeSide.toUpperCase()}</Badge>
                                <Button 
                                    icon={ArrowRightIcon} 
                                    disabled={activeSide === 'back'}
                                    onClick={() => setActiveSide('back')}
                                >
                                    Back View
                                </Button>
                            </InlineStack>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', background: '#f6f6f7', padding: '20px', borderRadius: '12px', minHeight: '400px' }}>
                            <img 
                                src={currentSidePreview} 
                                alt={`Design Preview ${activeSide}`} 
                                style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                            />
                        </div>
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </Page>
    );
}
