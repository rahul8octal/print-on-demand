import { Banner, Button, Card, Page, Text, TextField } from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { API } from "../../api";

function Settings() {
    const [generalValue, setGeneralValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get("/app/settings");
                const existing = data?.general?.general_setting?.value || "";
                setGeneralValue(existing);
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
                    general: [
                        {
                            key: "general_setting",
                            value: generalValue,
                        },
                    ],
                },
            });
            setMessage("Settings saved.");
        } catch (e) {
            setIsError(true);
            setMessage("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Page title="General Settings">
            <Card sectioned>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <TextField
                        label="General setting"
                        value={generalValue}
                        onChange={setGeneralValue}
                        autoComplete="off"
                        helpText="Use this field as a placeholder for future settings."
                        disabled={loading}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button primary onClick={handleSave} loading={saving} disabled={loading}>
                            Save
                        </Button>
                    </div>
                    {message ? (
                        <Banner status={isError ? "critical" : "success"}>
                            <Text as="p" variant="bodySm">
                                {message}
                            </Text>
                        </Banner>
                    ) : null}
                </div>
            </Card>
        </Page>
    );
}

export default Settings;
