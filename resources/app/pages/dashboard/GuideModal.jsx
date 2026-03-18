import React, { useCallback, useEffect, useState } from 'react';
import {
    Text,
    Modal,
    BlockStack,
    Banner,
    Tabs,
    Divider,
    List, Link, Button, Icon
} from '@shopify/polaris';
import { ChevronRightIcon, ChevronLeftIcon } from '@shopify/polaris-icons';
import { useNavigate } from "react-router-dom";

const GuideModal = ({ openGuideModal, setOpenGuideModal, guideModalType, themeUrl, shop }) => {

    const navigate = useNavigate();
    const [selected, setSelected] = useState(0);
    const [buttonAction, setButtonAction] = useState({ label: '', action: () => { } });

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelected(selectedTabIndex),
        [],
    );

    const tabs = [
        {
            id: 'step-1',
            content: 'Step 1'
        },
        {
            id: 'step-2',
            content: 'Step 2',
        },
        {
            id: 'step-3',
            content: 'Step 3',
        },
        {
            id: 'step-4',
            content: 'Step 4',
        },
        {
            id: 'step-5',
            content: 'Step 5',
        },
    ];

    const frontLoginContent = (
        <>
            <Tabs
                tabs={tabs}
                selected={selected}
                onSelect={handleTabChange}
                disclosureText="More views"
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>

                    <div style={{ minWidth: '30px', display: 'flex', justifyContent: 'center' }}>
                        {selected > 0 && (
                            <Button
                                icon={ChevronLeftIcon}
                                onClick={() => handleTabChange(selected - 1)}
                                variant="tertiary"
                            />
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '20px' }}>
                            <Divider />
                        </div>
                        {selected === 0 ?
                            <BlockStack gap="300">
                                <Text as="p">Go to Theme Settings using the button below and enable the AR Viewer app embed.</Text>
                                <img src="/images/guide/step1.png" alt="api settings" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
                            </BlockStack> : ''}
                        {selected === 1 ?
                            <>
                                <BlockStack gap="300">
                                    <Text as="p">Go to the product template in Theme Customizer and add the AR Viewer app block at your desired location on the product page.</Text>
                                    <img src="/images/guide/step2.png" alt="theme_customization" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
                                </BlockStack>
                                <div style={{ marginTop: '20px' }}>
                                    <Banner tone="warning">
                                        <p>Note: These changes will apply to your <b>live theme.</b> You can apply same to <b>unpublished theme</b></p>
                                    </Banner>
                                </div>
                            </> : ''}
                        {selected === 2 ?
                            <BlockStack gap="300">
                                <Text as="p">Once all 4 setup steps are completed, you can proceed with the app configuration.</Text>
                                <img src="/images/guide/step3.png" alt="invitation_group" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
                            </BlockStack> : ''}
                        {selected === 3 ?
                            <BlockStack gap="300">
                                <Text as="p">Create AR-Viewer configuration by clicking on add button in dashboard. select desired product to connect with and upload your 3D model (.glb or .gltf)</Text>
                                <img src="/images/guide/step4.png" alt="invitation_group" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
                            </BlockStack> : ''}
                        {selected === 4 ?
                            <BlockStack gap="300">
                                <Text as="p">To customize the storefront look. Visit Theme Editor in this app.</Text>
                                <img src="/images/guide/step5.png" alt="invitation_group" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain' }} />
                            </BlockStack> : ''}
                    </div>

                    <div style={{ minWidth: '30px', display: 'flex', justifyContent: 'center' }}>
                        {selected < 4 && (
                            <Button
                                icon={ChevronRightIcon}
                                onClick={() => handleTabChange(selected + 1)}
                                variant="tertiary"
                            />
                        )}
                    </div>
                </div>
            </Tabs>
        </>
    );

    useEffect(() => {
        if (selected === 4) {
            setButtonAction({
                label: 'Done',
                action: () => setOpenGuideModal(false)
            })
        }
    }, [selected])

    const guideConfig = {
        'front-login': {
            title: 'Product Configuration Guide',
            content: frontLoginContent,
            disabled: false,
        },
    };

    const { title, content, disabled } = guideConfig[guideModalType] || {};

    return (
        <>
            <Modal
                id="app-guide"
                size="large"
                open={openGuideModal}
                onClose={() => setOpenGuideModal(false)}
                title={title}
                primaryAction={
                    selected === 4
                        ? {
                            content: 'Done',
                            onAction: () => {
                                setOpenGuideModal(false);
                            }
                        }
                        : undefined
                }
            >
                <Modal.Section>
                    {content}
                </Modal.Section>
            </Modal>
        </>
    );
}

export default GuideModal;