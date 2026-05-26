const fs = require('fs');

let content = fs.readFileSync('src/components/AnalyzerView.tsx', 'utf8');

// Replace tg-bg with #0E1520 or clear
content = content.replace(/bg-tg-bg/g, 'bg-tg-bg'); // Keep as is but rely on index.css
content = content.replace(/bg-tg-card/g, 'bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05]'); 

// Buttons
content = content.replace(/bg-tg-accent hover:bg-tg-accent-hover text-white/g, 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.5)] border border-white/5');

// Main Container
content = content.replace(/className="flex flex-col h-full bg-tg-bg/g, 'className="flex flex-col h-full bg-tg-bg relative z-10 animate-fade-in');

// Borders removal - replace strong borders with soft dividers
content = content.replace(/border-tg-border/g, 'border-white/[0.05]');

// Remove explicit dark colors that clash with the new style
content = content.replace(/bg-\[\#182C24\]/g, 'bg-emerald-500/10 border-emerald-500/20 shadow-sm');
content = content.replace(/bg-\[\#2D1B20\]/g, 'bg-red-500/10 border-red-500/20 shadow-sm');
content = content.replace(/bg-\[\#132535\]/g, 'bg-sky-500/10 border-sky-500/20 shadow-sm');
content = content.replace(/bg-\[\#2C2115\]/g, 'bg-orange-500/10 border-orange-500/20 shadow-sm');
content = content.replace(/bg-\[\#122A26\]/g, 'bg-teal-500/10 border-teal-500/20 shadow-sm');
content = content.replace(/bg-\[\#2A2B3D\]/g, 'bg-purple-500/10 border-purple-500/20 shadow-sm');

// Remove some rounded-xl for rounded-2xl or rounded-[24px] for modern look
content = content.replace(/rounded-xl/g, 'rounded-2xl');

fs.writeFileSync('src/components/AnalyzerView.tsx', content);

let manualsView = fs.readFileSync('src/components/ManualsView.tsx', 'utf8');
manualsView = manualsView.replace(/bg-tg-card/g, 'bg-tg-card shadow-lg backdrop-blur-xl border border-white/[0.05]');
manualsView = manualsView.replace(/border-tg-border/g, 'border-white/[0.05]');
manualsView = manualsView.replace(/bg-tg-accent hover:bg-tg-accent-hover text-white/g, 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.5)]');
manualsView = manualsView.replace(/rounded-xl/g, 'rounded-2xl');
fs.writeFileSync('src/components/ManualsView.tsx', manualsView);

console.log("Updated styling for AnalyzerView and ManualsView");
