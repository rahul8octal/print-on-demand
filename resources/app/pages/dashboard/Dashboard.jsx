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
    Icon
} from '@shopify/polaris';
import { ExternalIcon, StoreIcon } from '@shopify/polaris-icons';
import React, { useState, useEffect } from 'react';
import { API } from '../../api';
import { useSelector } from "react-redux";

export default function Dashboard() {
    const shop = useSelector(state => state.shopStore?.shop);
    const [loading, setLoading] = useState(true);
    const [designs, setDesigns] = useState([]);
    
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

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': return <Badge tone="warning">Pending Fulfillment</Badge>;
            case 'processing': return <Badge tone="info">Processing via Printful</Badge>;
            case 'printed': return <Badge tone="success">Shipped</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const handleSync = async (id) => {
        try {
            const { data } = await API.post(`/app/shops/designs/${id}/sync`);
            if (data.success) {
                fetchDesigns();
            }
        } catch (e) {
            console.error('Manual sync failed', e);
        }
    };

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
                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4 }}>
                                        <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                            <BlockStack gap="100">
                                                <Text variant="bodySm" tone="subdued">Pending Provider Sync</Text>
                                                <Text variant="headingLg">{designs.filter(d => d.status === 'pending').length || 0}</Text>
                                            </BlockStack>
                                        </Box>
                                    </Grid.Cell>
                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4 }}>
                                        <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                            <BlockStack gap="100">
                                                <Text variant="bodySm" tone="subdued">Printful Printing</Text>
                                                <Text variant="headingLg">{designs.filter(d => d.status === 'processing').length || 0}</Text>
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
                                        { title: 'Fulfillment Status' },
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
                                                    {getStatusBadge(design.status)}
                                                    {design.status === 'pending' && (
                                                        <Button 
                                                            size="slim" 
                                                            tone="magic" 
                                                            variant="primary" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSync(design.id);
                                                            }}
                                                        >
                                                            Sync to Provider
                                                        </Button>
                                                    )}
                                                </InlineStack>
                                            </IndexTable.Cell>
                                            <IndexTable.Cell>
                                                <Link url={design.design_image_url} external target="_blank">
                                                    <InlineStack gap="100" blockAlign="center">
                                                        <span>Download Print Asset</span>
                                                        <Icon source={ExternalIcon} />
                                                    </InlineStack>
                                                </Link>
                                            </IndexTable.Cell>
                                        </IndexTable.Row>
                                    ))}
                                </IndexTable>
                            )}
                        </Card>
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
