import { Banner, Button, Card, Page, Text, TextField } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { API } from "../../api";

function Settings() {
    const [printfulKey, setPrintfulKey] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get("/app/settings");
                // data is grouped by 'group' -> 'key' -> {value, ...}
                const existingKey = data?.pod?.printful_api_key?.value || "";
                setPrintfulKey(existingKey);
            } catch (e) {
                setIsError(true);
                setMessage("Unable to load settings.");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        setIsError(false);
        try {
            await API.post("/app/settings", {
                settings: {
                    pod: [
                        {
                            key: "printful_api_key",
                            value: printfulKey,
                        },
                    ],
                },
            });
            setMessage("Settings saved successfully.");
        } catch (e) {
            setIsError(true);
            setMessage("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Page 
            title="Integrations & Settings" 
            subtitle="Configure your Print-on-Demand provider and app preferences."
        >
            <BlockStack gap="500">
                {message && (
                    <Banner tone={isError ? "critical" : "success"} onDismiss={() => setMessage("")}>
                        <p>{message}</p>
                    </Banner>
                )}

                <Layout>
                    <Layout.AnnotatedSection
                        title="Printful Integration"
                        description="Enter your Printful API Key to automate order fulfillment. You can find this in your Printful Dashboard settings."
                    >
                        <Card padding="500">
                            <BlockStack gap="400">
                                <TextField
                                    label="Printful API Key"
                                    value={printfulKey}
                                    onChange={setPrintfulKey}
                                    autoComplete="off"
                                    type="password"
                                    placeholder="pk_..."
                                    disabled={loading}
                                    helpText="This key is used to securely send orders to Printful for printing and shipping."
                                />
                                <InlineStack align="end">
                                    <Button 
                                        variant="primary" 
                                        onClick={handleSave} 
                                        loading={saving} 
                                        disabled={loading}
                                    >
                                        Save Changes
                                    </Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </Layout.AnnotatedSection>

                    <Layout.AnnotatedSection
                        title="App Information"
                        description="Current version and status of your POD Studio integration."
                    >
                        <Card padding="500">
                            <BlockStack gap="200">
                                <Text as="p" variant="bodyMd">
                                    <strong>Status:</strong> <Badge tone="success">Active</Badge>
                                </Text>
                                <Text as="p" variant="bodyMd">
                                    <strong>Version:</strong> v2.1.0-beta
                                </Text>
                            </BlockStack>
                        </Card>
                    </Layout.AnnotatedSection>
                </Layout>
            </BlockStack>
        </Page>
    );
}

export default Settings;
