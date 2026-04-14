import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
const STEPS = ['Details', 'Review', 'Confirmation'];
export function WizardSteps({ current }) {
    return (_jsx("ol", { className: "mb-6 flex items-center gap-2 text-xs", children: STEPS.map((label, i) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: clsx('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold', i < current && 'bg-indigo-600 text-white', i === current && 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600', i > current && 'bg-zinc-100 text-zinc-400'), children: i + 1 }), _jsx("span", { className: clsx('uppercase tracking-wider', i === current ? 'text-zinc-900' : 'text-zinc-400'), children: label }), i < STEPS.length - 1 && _jsx("span", { className: "h-px w-8 bg-zinc-200" })] }, label))) }));
}
