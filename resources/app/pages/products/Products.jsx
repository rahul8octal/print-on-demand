import {
    Page,
    Layout,
    Card,
    IndexTable,
    Text,
    Badge,
    Button,
    Thumbnail,
    InlineStack,
    Box,
    Spinner,
    Banner,
    EmptyState,
} from '@shopify/polaris';
import { ImageIcon, ViewIcon } from '@shopify/polaris-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { API } from '../../api';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const { shop } = useSelector(state => state.shopStore);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/app/product/shopify');
            if (data.success) {
                setProducts(data.data);
            } else {
                setError(data.message || 'Failed to fetch Shopify products.');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to fetch Shopify products. Please check your shop permissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleTogglePod = async (product) => {
        try {
            setActionLoading(product.id);
            const { data } = await API.post('/app/product/toggle-pod', {
                product_id: product.id,
                product_title: product.title
            });
            if (data.success) {
                // Update local state to reflect change
                setProducts(prev => prev.map(p => 
                    p.id === product.id ? { ...p, is_configured: !p.is_configured } : p
                ));
            }
        } catch (e) {
            console.error('Toggle failed', e);
        } finally {
            setActionLoading(null);
        }
    };

    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    const rowMarkup = products.map(
        (product, index) => (
            <IndexTable.Row
                id={product.id}
                key={product.id}
                position={index}
            >
                <IndexTable.Cell>
                    <InlineStack gap="300" blockAlign="center">
                        <Thumbnail
                            source={product.image?.src || ImageIcon}
                            alt={product.title}
                            size="small"
                        />
                        <Text variant="bodyMd" fontWeight="bold" as="span">
                            {product.title}
                        </Text>
                    </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={product.is_configured ? 'success' : 'attention'}>
                        {product.is_configured ? 'Customizable' : 'Standard'}
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <InlineStack gap="200">
                        <Button
                            loading={actionLoading === product.id}
                            variant={product.is_configured ? 'primary' : 'secondary'}
                            tone={product.is_configured ? 'critical' : 'success'}
                            onClick={() => handleTogglePod(product)}
                        >
                            {product.is_configured ? 'Disable Custom Studio' : 'Enable Custom Studio'}
                        </Button>
                        <Button
                            icon={ViewIcon}
                            onClick={() => {
                                const domain = shop?.name || window.location.host;
                                const url = `https://${domain}/products/${product.handle}`;
                                window.open(url, '_blank');
                            }}
                        >
                            Preview
                        </Button>
                    </InlineStack>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page
            title="Manage POD Products"
            subtitle="Select which products from your store should be customizable by customers."
            primaryAction={{ content: 'Refresh Products', onAction: fetchProducts }}
        >
            <Layout>
                <Layout.Section>
                    {error && (
                        <Box paddingBlockEnd="400">
                            <Banner tone="warning" onDismiss={() => setError(null)}>
                                <p>{error}</p>
                            </Banner>
                        </Box>
                    )}

                    <Card padding="0">
                        {loading ? (
                            <Box padding="1000">
                                <InlineStack align="center">
                                    <Spinner size="large" />
                                </InlineStack>
                            </Box>
                        ) : products.length === 0 ? (
                            <EmptyState
                                heading="No products found"
                                action={{ content: 'Refresh Storefront', onAction: fetchProducts }}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>We couldn't find any products in your Shopify store. Add products in Shopify first.</p>
                            </EmptyState>
                        ) : (
                            <IndexTable
                                resourceName={resourceName}
                                itemCount={products.length}
                                headings={[
                                    { title: 'Product' },
                                    { title: 'POD Status' },
                                    { title: 'Actions' },
                                ]}
                                selectable={false}
                            >
                                {rowMarkup}
                            </IndexTable>
                        )}
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
