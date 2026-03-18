import {
    Page,
    Card,
    BlockStack,
    Button,
    Text,
    DropZone,
    Spinner,
    Select,
    Modal,
    Toast,
    Frame,
    Pagination,
    TextField,
    EmptySearchResult,
    Tabs,
    Box,
    InlineStack,
    Grid,
    Icon,
    Thumbnail,
    Badge, List, Banner, Tooltip, IndexTable, Layout, RadioButton
} from '@shopify/polaris';
import {
    DeleteIcon,
    EditIcon,
    XSmallIcon,
    CheckIcon,
    XIcon,
    PlayIcon,
    PlusIcon,
    StoreIcon,
    RefreshIcon,
    ViewIcon,
    HideIcon
} from '@shopify/polaris-icons';

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Product3DView from '../../components/Product3DView';
import { API } from '../../api';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useSelector } from "react-redux";

function Dashboard() {
    const navigate = useNavigate();
    const shop = useSelector(state => state.shopStore?.shop);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [modalProducts, setModalProducts] = useState([]);
    const [modalActive, setModalActive] = useState(false);
    const [planLimitModal, setPlanLimitModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [deleteModalActive, setDeleteModalActive] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [toggleStates, setToggleStates] = useState({});
    const [selectedTab, setSelectedTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editModalActive, setEditModalActive] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [depth, setDepth] = useState('');
    const [dimensionUnit, setDimensionUnit] = useState('in');
    const [productType, setProductType] = useState('furniture');
    const [showDimensions, setShowDimensions] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [previewUrl, setPreviewUrl] = useState('');
    const productLimit = shop?.plan?.product_limit ?? shop?.product_limit ?? 0;
    const isDataReady = !!shop && !loading && modalProducts.length !== null;

    const isFreePlan = !shop?.plan || (shop?.plan?.slug?.toLowerCase?.() === 'free') || productLimit <= 1;

    const limitReached =
        isDataReady &&
        isFreePlan &&
        productLimit > 0 &&
        modalProducts.length >= productLimit;
    const allowedProductIds = isFreePlan ? modalProducts.slice(0, productLimit).map(p => p.modelId) : [];

    // Tab configuration
    const tabs = [
        {
            id: 'all-products',
            content: 'All Products',
            accessibilityLabel: 'All products with 3D models',
            panelID: 'all-products-panel',
        },
        {
            id: 'active-products',
            content: 'Active',
            accessibilityLabel: 'Active 3D products',
            panelID: 'active-products-panel',
        },
        {
            id: 'inactive-products',
            content: 'Inactive',
            accessibilityLabel: 'Inactive 3D products',
            panelID: 'inactive-products-panel',
        },
    ];

    const getData = async () => {
        try {
            setLoading(true);
            const response = await API.get('/app/dashboard');
            setData(response.data)
        } catch (e) {
            console.error('Failed to fetch plans', e);
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
            await getData();
        } catch (e) {
            console.error('Failed to update current tab', e);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelectedTab(selectedTabIndex),
        [],
    );

    const handleDrop = useCallback((_dropFiles, acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const maxSize = 20 * 1024 * 1024; // 20 MB

        const allowedExtensions = ['.fbx', '.glb', '.gltf'];
        const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            setErrorMessage('Only .fbx, .glb, and .gltf files are allowed.');
            return;
        }

        if (file.size > maxSize) {
            setErrorMessage('File size must be less than 20 MB.');
            return;
        }

        setUploadedFile(file);
        setErrorMessage('');
    }, []);

    useEffect(() => {
        if (uploadedFile) {
            const url = URL.createObjectURL(uploadedFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl('');
        }
    }, [uploadedFile]);

    const getProducts = async () => {
        try {
            const res = await API.get('/app/test-import-products');

            const formattedProducts = res.data.data.map((p) => ({
                productId: String(p.id),
                name: p.title,
                image: p.image?.src,
                handle: p.handle,
            }));

            setProducts(formattedProducts);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleToastActive = useCallback(
        () => setToastActive((active) => !active),
        [],
    );

    const getModalProducts = async () => {
        try {
            const res = await API.get('/app/product');
            const modelData = res.data.data;

            const merged = modelData.map(item => {
                const matchedProduct = products.find(
                    p => p.productId === String(item.product_id),
                );

                return {
                    modelId: item.id,
                    productId: item.product_id,
                    product_model: item.product_model,
                    media: item.media || [],
                    product_configs: item.product_configs || [],
                    name: matchedProduct?.name || 'Unknown Product',
                    image: matchedProduct?.image,
                    handle: matchedProduct?.handle,
                    is_active: item.is_active,
                    modelUrl: item.model_url,
                    width: item.width,
                    height: item.height,
                    depth: item.depth,
                    dimension_unit: item.dimension_unit,
                    product_type: item.product_type,
                };
            });

            setModalProducts(merged);
            const initialToggles = {};
            merged.forEach(item => {
                initialToggles[item.modelId] = item.is_active;
            });
            setToggleStates(initialToggles);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setLoading(true);
            const response = await API.delete(
                `/app/product/${deleteTarget.modelId}`,
            );

            await getModalProducts();
            setToastMessage(
                response?.data?.message,
            );
            setToastActive(true);

        } catch (error) {
            console.error('Delete failed:', error);
            setToastActive(true);

        } finally {
            setLoading(false);
            setDeleteModalActive(false);
            setDeleteTarget(null);
        }
    };

    const handleUpdate = async () => {
        if (!selectedProduct) return;

        if (saving) return;
        setSaving(true);

        const formData = new FormData();
        formData.append('product_id', selectedProduct);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('depth', depth);
        formData.append('dimension_unit', dimensionUnit);
        formData.append('product_type', productType);
        if (uploadedFile) {
            formData.append('model', uploadedFile);
        }

        try {
            const response = await API.post(`/app/product/${editTarget.modelId}/update`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await getModalProducts();

            setEditModalActive(false);
            setEditTarget(null);
            setUploadedFile(null);
            setSelectedProduct('');

            setToastMessage(response?.data?.message);
            setToastActive(true);

        } catch (error) {
            console.error('Error updating model:', error);
            setToastMessage('Failed to update product');
            setToastActive(true);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditTarget(product);
        setSelectedProduct(product.productId);
        setWidth(product.width || '');
        setHeight(product.height || '');
        setDepth(product.depth || '');
        setDimensionUnit(product.dimension_unit || 'in');
        setProductType(product.product_type || 'furniture');
        setUploadedFile(null); // Reset uploaded file for new edit session
        setEditModalActive(true);
    };

    const handleCreate = async () => {
        if (!selectedProduct || !uploadedFile) return;

        if (limitReached) {
            setPlanLimitModal(true);
            return;
        }

        if (saving) return;
        setSaving(true);

        const formData = new FormData();
        formData.append('product_id', selectedProduct);
        if (uploadedFile) {
            formData.append('model', uploadedFile);
        } else {
            return; // Nothing to save
        }
        formData.append('width', width);
        formData.append('height', height);
        formData.append('depth', depth);
        formData.append('dimension_unit', dimensionUnit);
        formData.append('product_type', productType);

        try {
            const response = await API.post('/app/product/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await getModalProducts();

            setModalActive(false);
            setUploadedFile(null);
            setSelectedProduct('');

            setToastMessage(response?.data?.message);

            if (data.productCount == 0 && data.currentTab === 3) {
                await postData(4);
            }
            setToastActive(true);

        } catch (error) {
            console.error('Error uploading model:', error);

            setToastMessage('Failed to upload model');
            setToastActive(true);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        getData();
        getProducts();
    }, []);

    useEffect(() => {
        if (products.length) {
            getModalProducts();
        }
    }, [products]);

    // Filter products based on search query
    const filteredProducts = modalProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Filter products based on active tab
    const getFilteredProductsByTab = () => {
        const filteredBySearch = filteredProducts;

        switch (selectedTab) {
            case 1: // Active tab
                return filteredBySearch.filter(
                    product => toggleStates[product.modelId]);
            case 2: // Inactive tab
                return filteredBySearch.filter(
                    product => !toggleStates[product.modelId]);
            default: // All products tab
                return filteredBySearch;
        }
    };

    const tabFilteredProducts = getFilteredProductsByTab();
    const totalItems = tabFilteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginatedProducts = tabFilteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    const handleToggleChange = async (modelId, isLocked = false) => {
        if (isLocked) {
            setPlanLimitModal(true);
            return;
        }
        const previousValue = !!toggleStates[modelId];

        setToggleStates(prev => ({
            ...prev,
            [modelId]: !previousValue,
        }));

        try {
            const response = await API.post(
                `/app/product/${modelId}/update_status`);
            setToastMessage(response?.data?.message);
            setToastActive(true);

        } catch (error) {
            console.error('Toggle update failed', error);
            setToggleStates(prev => ({
                ...prev,
                [modelId]: previousValue,
            }));
        }
    };

    // Product Card Component


    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, selectedTab]);

    // Reset to first page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTab]);

    const rowStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "16px",
        color: "#202223",
    };

    const checkStyle = {
        width: "17px",
        height: "17px",
        color: "#ffffff",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontWeight: "bold",
        flexShrink: 0,
    };

    const textStyle = {
        fontWeight: 500,
        fontSize: "12px",
    };
    const isFirstStepDone = [1, 2, 3, 4].includes(data?.currentTab);
    const isSecondStepDone = [2, 3, 4].includes(data?.currentTab) || data?.frontEndLoginHelperEnabled;
    const isThirdStepDone = [3, 4].includes(data?.currentTab) || data?.appPreviewBlockEnabled;
    const isFourthStepDone = [4].includes(data?.currentTab) || data?.productCount > 0;

    return (
        <Frame>
            <Page title="Dashboard" fullWidth>
                <Layout>
                    <Layout.Section>
                        <BlockStack gap="400">


                            {limitReached && (
                                <Banner title="Free Plan Limit Reached" action={{ content: 'View Plans', onAction: () => navigate('/plans') }} tone="warning">
                                    <List><List.Item>Upgrade to Pro to expand your 3D product library and editing capabilities.</List.Item></List>
                                </Banner>
                            )}

                            <Card padding="500">
                                <BlockStack gap="500">
                                    <InlineStack align="space-between">
                                        <BlockStack gap="100">
                                            <Text variant="headingLg" as="h2">Your AR is Live 🚀</Text>
                                            <Text tone="subdued">Everything is set up and running smoothly.</Text>
                                        </BlockStack>
                                        <InlineStack gap="300">
                                            <Button icon={StoreIcon} onClick={() => shop?.name && window.open(`https://${shop.name}`, '_blank')}>Preview on Store</Button>
                                        </InlineStack>
                                    </InlineStack>

                                    <Grid>
                                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4 }}>
                                            <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                                <BlockStack gap="100">
                                                    <Text variant="bodySm" tone="subdued">Products with AR</Text>
                                                    <Text variant="headingLg">{data?.productCount || 0}</Text>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4 }}>
                                            <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                                <BlockStack gap="100">
                                                    <Text variant="bodySm" tone="subdued">Active</Text>
                                                    <Text variant="headingLg">{Object.values(toggleStates).filter(Boolean).length}</Text>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4 }}>
                                            <Box padding="400" borderRadius="200" background="bg-surface-secondary">
                                                <BlockStack gap="100">
                                                    <Text variant="bodySm" tone="subdued">Last Activity</Text>
                                                    <Text variant="headingLg">Today</Text>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                    </Grid>
                                </BlockStack>
                            </Card>

                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}>
                                    <Card padding="500">
                                        {loading ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                                <Spinner size="large" />
                                            </div>
                                        ) : (
                                            <BlockStack gap="400">
                                                <Text variant="headingMd" as="h2">Bring Your Products to Life with AR 3D Configuration</Text>
                                                <Text tone="subdued">Get started with AR 3D product configuration by setting up models, linking them to products, and enabling customer personalization—all in a few simple steps.</Text>
                                                <BlockStack style={{ flexDirection: "row", gap: "30px" }}>
                                                    <BlockStack style={rowStyle}>
                                                        <span style={{ ...checkStyle, backgroundColor: isFirstStepDone ? "#008060" : "#D82C0D" }}><Icon source={isFirstStepDone ? CheckIcon : XIcon} /></span>
                                                        <span style={textStyle}>Read Tutorial</span>
                                                    </BlockStack>
                                                    <BlockStack style={rowStyle}>
                                                        <span style={{ ...checkStyle, backgroundColor: isSecondStepDone ? "#008060" : "#D82C0D" }}><Icon source={isSecondStepDone ? CheckIcon : XIcon} /></span>
                                                        <span style={textStyle}>Embed AR App Block</span>
                                                    </BlockStack>
                                                    <BlockStack style={rowStyle}>
                                                        <span style={{ ...checkStyle, backgroundColor: isThirdStepDone ? "#008060" : "#D82C0D" }}><Icon source={isThirdStepDone ? CheckIcon : XIcon} /></span>
                                                        <span style={textStyle}>Add AR Preview Block</span>
                                                    </BlockStack>
                                                    <BlockStack style={rowStyle}>
                                                        <span style={{ ...checkStyle, backgroundColor: isFourthStepDone ? "#008060" : "#D82C0D" }}><Icon source={isFourthStepDone ? CheckIcon : XIcon} /></span>
                                                        <span style={textStyle}>Create AR Configuration</span>
                                                    </BlockStack>
                                                </BlockStack>
                                                <InlineStack gap="300">
                                                    <Button onClick={() => navigate('/app-setup')}>App Setup</Button>
                                                    {/* <Button icon={PlayIcon} onClick={() => window.open('https://youtu.be/OU9e9p9yE9Y?si=UIYWtb7LjRlkmJjq', '_blank')}>Watch Video</Button> */}
                                                </InlineStack>
                                            </BlockStack>
                                        )}
                                    </Card>
                                </Grid.Cell>
                            </Grid>

                            <Card>
                                <BlockStack gap="400">
                                    <InlineStack align="space-between">
                                        <div style={{ width: '400px' }}>
                                            <TextField label="" placeholder="Search products..." value={searchQuery} onChange={setSearchQuery} autoComplete="off" clearButton onClearButtonClick={() => setSearchQuery('')} />
                                        </div>
                                        <Button variant="primary" size="large" icon={PlusIcon} onClick={() => { if (limitReached) { setPlanLimitModal(true); return; } setModalActive(true); }}>
                                            Add New AR Product
                                        </Button>
                                    </InlineStack>

                                    <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                                        {loading ? (
                                            <div style={{ padding: 50, textAlign: 'center' }}><Spinner size="large" /></div>
                                        ) : tabFilteredProducts.length === 0 ? (
                                            <Box padding="800">
                                                <EmptySearchResult title={selectedTab === 0 ? 'No Products yet' : selectedTab === 1 ? 'No Active Products' : 'No Inactive Products'} description={selectedTab === 0 ? 'Try changing the filters or search term' : selectedTab === 1 ? 'Activate products to see them here' : 'Deactivate products to see them here'} withIllustration />
                                            </Box>
                                        ) : (
                                            <>
                                                <IndexTable resourceName={{ singular: 'product', plural: 'products' }} itemCount={paginatedProducts.length}
                                                    headings={[
                                                        { title: 'Product' },
                                                        { title: 'Status', alignment: 'center' },
                                                        { title: 'Actions', alignment: 'center' },
                                                    ]} selectable={false}>
                                                    {paginatedProducts.map((product, index) => {
                                                        const isLocked = isFreePlan && !allowedProductIds.includes(product.modelId);
                                                        return (
                                                            <IndexTable.Row id={product.modelId} key={product.modelId} position={index}>
                                                                <IndexTable.Cell>
                                                                    <InlineStack gap="300" blockAlign="center">
                                                                        <Thumbnail source={product.image} alt={product.name} size="medium" />
                                                                        <BlockStack gap="050">
                                                                            <Text variant="bodyMd" fontWeight="bold" as="span">{product.name}</Text>
                                                                            <Text variant="bodyXs" tone="subdued">ID: {product.productId}</Text>
                                                                        </BlockStack>
                                                                    </InlineStack>
                                                                </IndexTable.Cell>
                                                                <IndexTable.Cell>
                                                                    <Tooltip content={toggleStates[product.modelId] ? "Active on Store" : "Hidden from Store"}>
                                                                        <InlineStack gap="200" align="center" blockAlign="center">
                                                                            <ToggleSwitch checked={!!toggleStates[product.modelId]} onChange={() => handleToggleChange(product.modelId, isLocked)} disabled={isLocked} />
                                                                            <Badge tone={isLocked ? 'critical' : (toggleStates[product.modelId] ? 'success' : 'warning')}>
                                                                                {isLocked ? 'Locked' : (toggleStates[product.modelId] ? 'Active' : 'Inactive')}
                                                                            </Badge>
                                                                        </InlineStack>
                                                                    </Tooltip>
                                                                </IndexTable.Cell>
                                                                <IndexTable.Cell>
                                                                    <InlineStack gap="200" align="center">
                                                                        <Button size="slim" icon={ViewIcon} disabled={!product.handle} onClick={() => shop?.name && window.open(`https://${shop.name}/products/${product.handle}`, '_blank')}>Preview</Button>
                                                                        <Button size="slim" icon={EditIcon} disabled={isLocked} onClick={() => handleEdit(product)}>Edit</Button>
                                                                        <Button size="slim" tone="critical" icon={DeleteIcon} onClick={() => { setDeleteTarget(product); setDeleteModalActive(true); }}>Delete</Button>
                                                                    </InlineStack>
                                                                </IndexTable.Cell>
                                                            </IndexTable.Row>
                                                        );
                                                    })}
                                                </IndexTable>
                                                <Box padding="400" borderBlockStartWidth="025" borderColor="border-secondary">
                                                    <InlineStack align="space-between" blockAlign="center">
                                                        <Text variant="bodyMd" tone="subdued">Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products</Text>
                                                        <Pagination hasPrevious={currentPage > 1} onPrevious={() => setCurrentPage((prev) => prev - 1)} hasNext={currentPage < totalPages} onNext={() => setCurrentPage((prev) => prev + 1)} />
                                                    </InlineStack>
                                                </Box>
                                            </>
                                        )}
                                    </Tabs>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Layout.Section>
                </Layout>
                {/* -------- Create Modal -------- */}
                <Modal size="large" open={modalActive} onClose={() => {
                    setModalActive(false);
                    setUploadedFile(null);
                    setSelectedProduct('');
                    setErrorMessage('');
                    setWidth('');
                    setHeight('');
                    setDepth('');
                    setDimensionUnit('in');
                    setProductType('furniture');
                }} title="Add 3D Model" primaryAction={{
                    content: 'Save',
                    onAction: async () => {
                        handleCreate();
                    },
                    disabled: !uploadedFile || !selectedProduct || saving,
                    loading: saving,
                }} secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => {
                            setModalActive(false);
                            setUploadedFile(null);
                            setErrorMessage('');
                            setSelectedProduct('');
                            setWidth('');
                            setHeight('');
                            setDepth('');
                            setDimensionUnit('in');
                            setProductType('furniture');
                        },
                        disabled: saving,
                    },
                ]}>
                    <Modal.Section>
                        <BlockStack gap="400">
                            <Select label="Select Product" options={[
                                { label: 'Select product', value: '' },
                                ...products.map(p => ({
                                    label: p.name,
                                    value: p.productId,
                                }))]} value={selectedProduct} onChange={setSelectedProduct} />
                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 7, xl: 7 }}>
                                    <Box>
                                        <BlockStack gap="200">
                                            <Text variant="bodyMd" as="p" fontWeight="bold">
                                                Model Preview:
                                            </Text>
                                            <Box padding="200" background="bg-surface-secondary" borderRadius="200" overflowX="hidden" overflowY="hidden" position="relative" minHeight="510px">
                                                {previewUrl ? (
                                                    <>
                                                        <Product3DView
                                                            modelUrl={previewUrl}
                                                            extension={uploadedFile ? uploadedFile.name.split('.').pop().toLowerCase() : null}
                                                            height="510px"
                                                            isPreviewMode={true}
                                                            isAutoRotate={autoRotate}
                                                            showDimensions={showDimensions}
                                                            width={width}
                                                            height_dim={height}
                                                            depth={depth}
                                                            dimension_unit={dimensionUnit}
                                                            productType={productType}
                                                        />
                                                        
                                                        {/* Dimensions Toggle Overlay */}
                                                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 }}>
                                                            <button
                                                                onClick={() => setShowDimensions(!showDimensions)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '6px 14px',
                                                                    backgroundColor: showDimensions ? '#2c6ecb' : 'white',
                                                                    border: showDimensions ? 'none' : '1px solid #dfe3e8',
                                                                    borderRadius: '20px',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                                    fontSize: '13px',
                                                                    fontWeight: showDimensions ? '500' : '400',
                                                                    color: showDimensions ? 'white' : '#202223',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
                                                                    <Icon source={showDimensions ? ViewIcon : HideIcon} tone={showDimensions ? 'inherit' : 'subdued'} />
                                                                </div>
                                                                Dimensions
                                                            </button>
                                                        </div>

                                                        {/* Rotation Toggle Overlay */}
                                                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10 }}>
                                                            <button
                                                                onClick={() => setAutoRotate(!autoRotate)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '6px 14px',
                                                                    backgroundColor: autoRotate ? '#2c6ecb' : '#f6f6f7',
                                                                    color: autoRotate ? 'white' : '#202223',
                                                                    border: 'none',
                                                                    borderRadius: '20px',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                    fontSize: '13px',
                                                                    fontWeight: '500',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                Rotation
                                                                <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
                                                                    <Icon source={RefreshIcon} tone={autoRotate ? 'inherit' : 'subdued'} />
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ height: '410px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text tone="subdued">Upload a .glb file to see preview</Text>
                                                    </div>
                                                )}
                                            </Box>
                                        </BlockStack>
                                    </Box>
                                </Grid.Cell>

                                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 5, xl: 5 }}>
                                    <BlockStack gap="400">
                                        <div>
                                            <Box paddingBlockEnd="200">
                                                <BlockStack gap="100">
                                                    <Text variant="bodyMd" as="p">
                                                        Upload 3D Model
                                                    </Text>
                                                    <Text variant="bodyXs" as="p">
                                                        Supported formats: .glb Max size: 20 MB
                                                    </Text>
                                                </BlockStack>
                                            </Box>
                                            <DropZone
                                                allowMultiple={false}
                                                accept=".glb,.gltf"
                                                type="file"
                                                onDrop={handleDrop}
                                                disabled={!!uploadedFile}
                                            >
                                                {!uploadedFile ? (
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            padding: "20px",
                                                            height: "140px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <Text as="p" tone="subdued">
                                                            Drag & drop your 3D model here, or click to browse
                                                        </Text>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            padding: "16px",
                                                            height: "140px",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUploadedFile(null);
                                                                setErrorMessage('');
                                                            }}
                                                            style={{
                                                                position: "absolute",
                                                                top: 8,
                                                                right: 8,
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <Icon source={XSmallIcon} tone="critical" />
                                                        </button>

                                                        <Text variant="bodyMd" alignment="center">
                                                            {uploadedFile.name}
                                                        </Text>
                                                        <Text variant="bodySm" tone="subdued" alignment="center">
                                                            Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                        </Text>
                                                    </div>
                                                )}
                                            </DropZone>
                                            {errorMessage &&
                                                <Text color="critical">{errorMessage}</Text>}
                                        </div>
                                        <Box paddingBlockStart="200">
                                            <Text variant="headingSm" as="h5">
                                                Note: Only .glb files support AR preview.
                                            </Text>
                                        </Box>

                                        <Box paddingBlockStart="400">
                                            <BlockStack gap="200">
                                                <Text variant="headingMd" as="h3">Select Product Type:</Text>
                                                <InlineStack gap="400">
                                                     <RadioButton
                                                        label="Furniture"
                                                        checked={productType === 'furniture'}
                                                        id="furniture_type_create"
                                                        name="product_type_create"
                                                        onChange={() => setProductType('furniture')}
                                                    />
                                                    <RadioButton
                                                        label="Metal"
                                                        checked={productType === 'metal'}
                                                        id="metal_type_create"
                                                        name="product_type_create"
                                                        onChange={() => setProductType('metal')}
                                                    />
                                                </InlineStack>
                                            </BlockStack>
                                        </Box>

                                        <Box paddingBlockStart="200">
                                            <BlockStack gap="400">
                                                <Text variant="headingMd" as="h3">Product Dimensions (Optional)</Text>
                                                <Text tone="subdued">Set manual dimensions to override automatic measurements.</Text>
                                                <Grid>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Width" type="number" value={width} onChange={setWidth} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Height" type="number" value={height} onChange={setHeight} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Depth" type="number" value={depth} onChange={setDepth} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <Select label="Unit" options={[{ label: 'Inches (in)', value: 'in' }, { label: 'Centimeters (cm)', value: 'cm' }, { label: 'Millimeters (mm)', value: 'mm' }, { label: 'Meters (m)', value: 'm' }]} value={dimensionUnit} onChange={setDimensionUnit} />
                                                    </Grid.Cell>
                                                </Grid>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </Grid.Cell>
                            </Grid>
                        </BlockStack>
                    </Modal.Section>
                </Modal>

                {/* -------- Edit Modal -------- */}
                <Modal size="large" open={editModalActive} onClose={() => {
                    setEditModalActive(false);
                    setEditTarget(null);
                    setUploadedFile(null);
                    setSelectedProduct('');
                    setErrorMessage('');
                    setWidth('');
                    setHeight('');
                    setDepth('');
                    setDimensionUnit('in');
                }} title="Edit 3D Product" primaryAction={{
                    content: 'Update',
                    onAction: async () => {
                        handleUpdate();
                    },
                    disabled: !selectedProduct || saving,
                    loading: saving,
                }} secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => {
                            setEditModalActive(false);
                            setEditTarget(null);
                            setUploadedFile(null);
                            setErrorMessage('');
                            setSelectedProduct('');
                            setWidth('');
                            setHeight('');
                            setDepth('');
                            setDimensionUnit('in');
                        },
                        disabled: saving,
                    },
                ]}>
                    <Modal.Section>
                        <BlockStack gap="400">
                            <Select label="Selected Product" options={[
                                { label: 'Select product', value: '' },
                                ...products.map(p => ({
                                    label: p.name,
                                    value: p.productId,
                                }))] } value={selectedProduct} onChange={setSelectedProduct} disabled />

                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 7, md: 7, lg: 7, xl: 7 }}>
                                    {editTarget && (
                                        <Box>
                                            <BlockStack gap="200">
                                                <Text variant="bodyMd" as="p" fontWeight="bold">
                                                    Current Model Preview:
                                                </Text>
                                                <Box padding="200" background="bg-surface-secondary" borderRadius="200" overflowX="hidden" overflowY="hidden" position="relative" minHeight="512px">
                                                    <Product3DView
                                                        modelUrl={previewUrl || editTarget.modelUrl}
                                                        extension={uploadedFile ? uploadedFile.name.split('.').pop().toLowerCase() : (previewUrl ? 'glb' : null)}
                                                        height="512px"
                                                        isPreviewMode={true}
                                                        isAutoRotate={autoRotate}
                                                        showDimensions={showDimensions}
                                                        width={width}
                                                        height_dim={height}
                                                        depth={depth}
                                                        dimension_unit={dimensionUnit}
                                                        productType={productType}
                                                    />
                                                    
                                                    {/* Dimensions Toggle Overlay */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '20px',
                                                        left: '20px',
                                                        zIndex: 10
                                                    }}>
                                                        <button
                                                            onClick={() => setShowDimensions(!showDimensions)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '6px 14px',
                                                                backgroundColor: showDimensions ? '#2c6ecb' : 'white',
                                                                border: showDimensions ? 'none' : '1px solid #dfe3e8',
                                                                borderRadius: '20px',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                                fontSize: '13px',
                                                                fontWeight: showDimensions ? '500' : '400',
                                                                color: showDimensions ? 'white' : '#202223',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
                                                                <Icon source={showDimensions ? ViewIcon : HideIcon} tone={showDimensions ? 'inherit' : 'subdued'} />
                                                            </div>
                                                            Dimensions
                                                        </button>
                                                    </div>

                                                    {/* Rotation Toggle Overlay */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '20px',
                                                        right: '20px',
                                                        zIndex: 10
                                                    }}>
                                                        <button
                                                            onClick={() => setAutoRotate(!autoRotate)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '6px 14px',
                                                                backgroundColor: autoRotate ? '#2c6ecb' : '#f6f6f7',
                                                                color: autoRotate ? 'white' : '#202223',
                                                                border: 'none',
                                                                borderRadius: '20px',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                fontSize: '13px',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            Rotation
                                                            <div style={{ width: '16px', display: 'flex', alignItems: 'center' }}>
                                                                <Icon source={RefreshIcon} tone={autoRotate ? 'inherit' : 'subdued'} />
                                                            </div>
                                                        </button>
                                                    </div>
                                                </Box>
                                            </BlockStack>
                                        </Box>
                                    )}
                                </Grid.Cell>

                                <Grid.Cell columnSpan={{ xs: 12, sm: 5, md: 5, lg: 5, xl: 5 }}>
                                    <BlockStack gap="400">
                                        <div>
                                            <Box paddingBlockEnd="200">
                                                <BlockStack gap="100">
                                                    <Text variant="headingMd" as="h3">Upload New 3D Model</Text>
                                                    <Text variant="bodyXs" as="p">
                                                        Supported formats: .glb Max size: 20 MB (Leave empty to keep current model)
                                                    </Text>
                                                </BlockStack>
                                            </Box>
                                            <DropZone
                                                allowMultiple={false}
                                                accept=".glb,.gltf"
                                                type="file"
                                                onDrop={handleDrop}
                                            >
                                                {!uploadedFile ? (
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            padding: "20px",
                                                            height: "140px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <Text as="p" tone="subdued">
                                                            Drag & drop your new 3D model here, or click to browse
                                                        </Text>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            padding: "16px",
                                                            height: "140px",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUploadedFile(null);
                                                                setErrorMessage('');
                                                            }}
                                                            style={{
                                                                position: "absolute",
                                                                top: 8,
                                                                right: 8,
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            <Icon source={XSmallIcon} tone="critical" />
                                                        </button>

                                                        <Text variant="bodyMd" alignment="center">
                                                            {uploadedFile.name}
                                                        </Text>
                                                        <Text variant="bodySm" tone="subdued" alignment="center">
                                                            Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                        </Text>
                                                    </div>
                                                )}
                                            </DropZone>
                                            {errorMessage &&
                                                <Text color="critical">{errorMessage}</Text>}
                                            <Box paddingBlockStart="200">
                                                <Text variant="headingSm" as="h5">
                                                    Note: Only .glb files support AR preview.
                                                </Text>
                                            </Box>
                                        </div>

                                        <Box paddingBlockStart="100">
                                            <BlockStack gap="200">
                                                <Text variant="headingMd" as="h3">Select Product Type:</Text>
                                                <InlineStack gap="400">
                                                    <RadioButton
                                                        label="Furniture"
                                                        checked={productType === 'furniture'}
                                                        id="furniture_type_edit"
                                                        name="product_type_edit"
                                                        onChange={() => setProductType('furniture')}
                                                    />
                                                    <RadioButton
                                                        label="Metal"
                                                        checked={productType === 'metal'}
                                                        id="metal_type_edit"
                                                        name="product_type_edit"
                                                        onChange={() => setProductType('metal')}
                                                    />
                                                </InlineStack>
                                            </BlockStack>
                                        </Box>

                                        <Box paddingBlockStart="200">
                                            <BlockStack gap="400">
                                                <Text variant="headingMd" as="h3">Product Dimensions (Optional)</Text>
                                                <Text tone="subdued">Set manual dimensions to override automatic measurements.</Text>
                                                <Grid>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Width" type="number" value={width} onChange={setWidth} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Height" type="number" value={height} onChange={setHeight} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <TextField label="Depth" type="number" value={depth} onChange={setDepth} autoComplete="off" suffix={dimensionUnit} />
                                                    </Grid.Cell>
                                                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                                                        <Select label="Unit" options={[{ label: 'Inches (in)', value: 'in' }, { label: 'Centimeters (cm)', value: 'cm' }, { label: 'Millimeters (mm)', value: 'mm' }, { label: 'Meters (m)', value: 'm' }]} value={dimensionUnit} onChange={setDimensionUnit} />
                                                    </Grid.Cell>
                                                </Grid>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </Grid.Cell>
                            </Grid>
                        </BlockStack>
                    </Modal.Section>
                </Modal>

                {/* -------- Delete Modal -------- */}
                <Modal open={deleteModalActive} onClose={() => {
                    setDeleteModalActive(false);
                    setDeleteTarget(null);
                }} title="Delete product model?" primaryAction={{
                    content: 'Delete',
                    tone: 'critical',
                    onAction: handleDelete,
                }} secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => {
                            setDeleteModalActive(false);
                            setDeleteTarget(null);
                        },
                    },
                ]}>
                    <Modal.Section>
                        <Text as="p">
                            Are you sure you want to delete{' '}
                            <strong>{deleteTarget?.name}</strong>?
                            This action cannot be undone.
                        </Text>
                    </Modal.Section>
                </Modal>
                <Modal
                    open={planLimitModal}
                    onClose={() => setPlanLimitModal(false)}
                    title="Upgrade to Unlock More Products"
                    primaryAction={{
                        content: 'View Plans',
                        onAction: () => {
                            setPlanLimitModal(false);
                            navigate('/plans');
                        },
                    }}
                    secondaryActions={[
                        {
                            content: 'Close',
                            onAction: () => setPlanLimitModal(false),
                        },
                    ]}
                >
                    <Modal.Section>
                        <Text as="p">
                            You’re on the Free plan, which allows only {productLimit || 2} product. Upgrade to the Pro plan to add and manage more 3D products.
                        </Text>
                    </Modal.Section>
                </Modal>
            </Page>
            {toastActive && (
                <Toast content={toastMessage} onDismiss={toggleToastActive} />
            )}
        </Frame>
    );
}

export default Dashboard;
