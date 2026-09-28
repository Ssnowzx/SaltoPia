/** Where a wrong address lands: back to the map, in the site's own voice. */
export default function NotFound(): React.ReactElement {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-straw px-6 text-center">
      <p className="font-script text-4xl text-wine">Por aqui não tem estrada</p>
      <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-[0.04em] text-night uppercase sm:text-5xl">Lugar não encontrado</h1>
      <p className="mt-4 max-w-md font-sans text-base text-bark/80">O endereço não leva a nenhum lugar de Saltopia. O mapa mostra todos os que existem.</p>
      <a href="/" className="mt-8 rounded-button bg-night px-7 py-3 font-sans text-sm font-bold tracking-[0.1em] text-mist uppercase transition-colors hover:bg-wine">
        Voltar ao mapa
      </a>
    </main>
  );
}
