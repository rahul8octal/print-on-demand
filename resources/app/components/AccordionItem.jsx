import { Box, Text, Icon, InlineStack, Collapsible, Checkbox } from '@shopify/polaris';
import { ChevronDownIcon, ChevronUpIcon } from '@shopify/polaris-icons';
import { useState, useEffect } from 'react';

const AccordionItem = ({ title, children, hasToggle = false, toggleValue = false, onToggle }) => {
    const [open, setOpen] = useState(false);

    // If toggle is turned on, automatically open the accordion
    useEffect(() => {
        if (hasToggle && toggleValue) {
            setOpen(true);
        }
    }, [toggleValue, hasToggle]);

    return (
        <Box borderBlockEndWidth="025" borderColor="border">
            <Box
                padding="300"
                paddingBlock="500"
                onClick={() => setOpen(!open)}
            >
                <div style={{ cursor: 'pointer' }}>
                    <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="400" blockAlign="center">
                            {hasToggle && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <label className="switch">
                                        <input type="checkbox" checked={toggleValue} onChange={(e) => onToggle(e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                    <style>{`
                                        .switch {
                                            position: relative;
                                            display: inline-block;
                                            width: 36px;
                                            height: 20px;
                                        }
                                        .switch input {
                                            opacity: 0;
                                            width: 0;
                                            height: 0;
                                        }
                                        .slider {
                                            position: absolute;
                                            cursor: pointer;
                                            top: 0;
                                            left: 0;
                                            right: 0;
                                            bottom: 0;
                                            background-color: #ccc;
                                            transition: .4s;
                                            border-radius: 20px;
                                        }
                                        .slider:before {
                                            position: absolute;
                                            content: "";
                                            height: 16px;
                                            width: 16px;
                                            left: 2px;
                                            bottom: 2px;
                                            background-color: white;
                                            transition: .4s;
                                            border-radius: 50%;
                                        }
                                        input:checked + .slider {
                                            background-color: #008060;
                                        }
                                        input:checked + .slider:before {
                                            transform: translateX(16px);
                                        }
                                    `}</style>
                                </div>
                            )}
                            <Text as="h2" variant="bodyLg">
                                {title}
                            </Text>
                        </InlineStack>
                        <div style={{ width: 'fit-content' }}>
                            <Icon
                                source={open ? ChevronUpIcon : ChevronDownIcon}
                                tone="subdued"
                            />
                        </div>
                    </InlineStack>
                </div>
            </Box>

            <Collapsible open={open}>
                <Box padding="300">
                    {(!hasToggle || toggleValue) ? children : null}
                </Box>
            </Collapsible>
        </Box>
    );
};

export default AccordionItem;
