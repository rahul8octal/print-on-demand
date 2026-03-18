import {
    ChevronDownIcon,
    ChevronRightIcon,
    TickSmallIcon,
    MinusIcon,
    NoteIcon,
    MobileCancelMajor
} from "@shopify/polaris-icons";

import { Icon } from "@shopify/polaris";
import { useState } from "react";

export default function ModelPicker({
                                        groups,
                                        selectedQuestion,
                                        setQuestions,
                                        onClose,
                                    }) {
    const [expandedGroups, setExpandedGroups] = useState({});

    const [initialMesh] = useState(() => selectedQuestion?.mesh || []);

    const toggleGroup = (groupName, e) => {
        e.stopPropagation();
        setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleCancel = () => {
        if (selectedQuestion) {
            setQuestions((prev) =>
                prev.map((q) => {
                    if (q.id === selectedQuestion.id) {
                        return { ...q, mesh: initialMesh };
                    }
                    return q;
                })
            );
        }
        onClose();
    };

    const handleConfirm = () => {
        onClose();
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pt-1 select-none">
                <div className="text-sm/[20px] font-normal text-[#6d7175] mb-2">
                    Select the 3D model components you want to make customizable for this
                    specific option.
                </div>

                {/* Scene */}
                <div className="mb-0.5">
                    <div className="flex items-center px-2 py-1.5 rounded cursor-pointer group hover:bg-gray-100">
                        <div className="mr-2 p-0.5" onClick={(e) => e.stopPropagation()}>
                            <Icon source={ChevronDownIcon} tone="base" />
                        </div>

                        <div className="mr-2">
                            <div className="w-3.5 h-3.5 border border-gray-400 rounded bg-white" />
                        </div>

                        <span className="flex-1 text-sm font-medium text-gray-700">
                            Scene
                        </span>
                    </div>

                    {/* Groups */}
                    <div className="flex flex-col ml-4 border-l border-gray-200 pl-1 mt-0.5">
                        {Object.entries(groups).map(([groupName, parts]) => {
                            const isGroupExpanded = expandedGroups[groupName];

                            const groupPartsIds = parts.map((p) => p.name);
                            const selectedCount = groupPartsIds.filter((id) =>
                                selectedQuestion?.mesh?.includes(id)
                            ).length;

                            const isAllSelected =
                                parts.length > 0 && selectedCount === parts.length;
                            const isSomeSelected =
                                selectedCount > 0 && selectedCount < parts.length;

                            return (
                                <div key={groupName} className="mb-0.5">
                                    <div className="flex items-center px-2 py-1 rounded cursor-pointer group">
                                        <div
                                            className="mr-1 p-0.5"
                                            onClick={(e) => toggleGroup(groupName, e)}
                                        >
                                            <Icon
                                                source={
                                                    isGroupExpanded
                                                        ? ChevronDownIcon
                                                        : ChevronRightIcon
                                                }
                                                tone="base"
                                            />
                                        </div>

                                        {/* Group Checkbox */}
                                        <div
                                            className="mr-2 flex items-center justify-center w-5 h-5 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!selectedQuestion) return;

                                                setQuestions((prev) =>
                                                    prev.map((q) => {
                                                        if (q.id === selectedQuestion.id) {
                                                            const currentMesh = q.mesh || [];
                                                            let newMesh;

                                                            if (isAllSelected) {
                                                                newMesh = currentMesh.filter(
                                                                    (id) => !groupPartsIds.includes(id)
                                                                );
                                                            } else {
                                                                newMesh = [
                                                                    ...new Set([
                                                                        ...currentMesh,
                                                                        ...groupPartsIds,
                                                                    ]),
                                                                ];
                                                            }

                                                            return { ...q, mesh: newMesh };
                                                        }
                                                        return q;
                                                    })
                                                );
                                            }}
                                        >
                                            {isAllSelected ? (
                                                <div className="w-3.5 h-3.5 bg-[#008060] rounded flex items-center justify-center">
                                                    <Icon source={TickSmallIcon} tone="inverse" />
                                                </div>
                                            ) : isSomeSelected ? (
                                                <div className="w-3.5 h-3.5 bg-[#008060] rounded flex items-center justify-center">
                                                    <Icon source={MinusIcon} tone="inverse" />
                                                </div>
                                            ) : (
                                                <div className="w-3.5 h-3.5 border border-gray-400 rounded bg-white hover:border-gray-500" />
                                            )}
                                        </div>

                                        <Icon source={NoteIcon} tone="base" className="mr-2" />

                                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                                            {groupName}
                                        </span>
                                    </div>

                                    {/* Expanded Parts */}
                                    {isGroupExpanded && (
                                        <div className="flex flex-col ml-6 border-l border-gray-200 pl-1 mt-0.5">
                                            {parts.map((part) => {
                                                const isPartChecked =
                                                    selectedQuestion?.mesh?.includes(part.name);

                                                return (
                                                    <div
                                                        key={part.uuid}
                                                        className="flex items-center px-2 py-1 rounded cursor-pointer text-xs group"
                                                        onClick={() => {
                                                            if (!selectedQuestion) return;

                                                            setQuestions((prev) =>
                                                                prev.map((q) => {
                                                                    if (q.id === selectedQuestion.id) {
                                                                        const currentMesh = q.mesh || [];
                                                                        const newMesh = isPartChecked
                                                                            ? currentMesh.filter(
                                                                                (id) =>
                                                                                    id !== part.name
                                                                            )
                                                                            : [...currentMesh, part.name];

                                                                        return { ...q, mesh: newMesh };
                                                                    }
                                                                    return q;
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        {/* Part Checkbox */}
                                                        <div
                                                            className="mr-2 flex items-center justify-center w-5 h-5 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!selectedQuestion) return;

                                                                setQuestions((prev) =>
                                                                    prev.map((q) => {
                                                                        if (q.id === selectedQuestion.id) {
                                                                            const currentMesh =
                                                                                q.mesh || [];
                                                                            const newMesh =
                                                                                isPartChecked
                                                                                    ? currentMesh.filter(
                                                                                        (id) =>
                                                                                            id !== part.name
                                                                                    )
                                                                                    : [
                                                                                        ...currentMesh,
                                                                                        part.name,
                                                                                    ];

                                                                            return {
                                                                                ...q,
                                                                                mesh: newMesh,
                                                                            };
                                                                        }
                                                                        return q;
                                                                    })
                                                                );
                                                            }}
                                                        >
                                                            {isPartChecked ? (
                                                                <div className="w-3.5 h-3.5 bg-[#008060] rounded flex items-center justify-center">
                                                                    <Icon
                                                                        source={TickSmallIcon}
                                                                        tone="inverse"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-3.5 h-3.5 border border-gray-400 rounded bg-white hover:border-gray-500" />
                                                            )}
                                                        </div>

                                                        <Icon
                                                            source={MobileCancelMajor}
                                                            tone="base"
                                                            className="mr-2"
                                                        />

                                                        <span className="flex-1 truncate text-gray-600">
                                                            {part.name}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {Object.keys(groups).length === 0 && (
                    <div className="text-center mt-10 text-xs text-gray-600">
                        No parts found
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
                >
                    Cancel
                </button>

                <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 bg-[#008060] text-white rounded hover:bg-[#006e52] text-sm font-medium"
                >
                    Confirm
                </button>
            </div>
        </>
    );
}
