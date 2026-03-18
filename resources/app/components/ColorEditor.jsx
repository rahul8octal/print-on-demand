export default function ColorEditor({
                                        selectedQuestion,
                                        setQuestions,
                                        selectedOption,
                                    }) {
    return (
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pt-1 select-none">
            <div className="mb-0.5">
                <h3 className="text-sm font-medium text-black">Display type</h3>

                <div className="mt-2">
                    <p>Color picker</p>

                    <div className="flex gap-2">
                        {/* Color Picker Box */}
                        <div className="relative w-10 h-6 rounded-md overflow-hidden border border-gray-600 ring-offset-2 ring-offset-[#1e1e1e] transition-all hover:scale-110">
                            <input
                                type="color"
                                value={selectedOption?.color || "#000000"}
                                onChange={(e) => {
                                    setQuestions((prev) => {
                                        return prev.map((q) => {
                                            if (q.id === selectedQuestion?.id) {
                                                return {
                                                    ...q,
                                                    options: q.options.map((o) => {
                                                        if (o.id === selectedOption?.id) {
                                                            return {
                                                                ...o,
                                                                color: e.target.value,
                                                            };
                                                        }
                                                        return o;
                                                    }),
                                                };
                                            }
                                            return q;
                                        });
                                    });
                                }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 m-0 border-0"
                            />
                        </div>

                        {/* Hex Value */}
                        <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[14px] text-black font-mono">
                                {selectedOption?.color || "#000000"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
