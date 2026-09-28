import './globals.css';

export const metadata = {
  title: 'VectorCraft Netlify - Image to SVG Vector Converter',
  description: '100% Client-Side WebAssembly Image to SVG Vector Converter',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
