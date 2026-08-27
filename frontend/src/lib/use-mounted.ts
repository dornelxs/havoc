"use client";

import { useEffect, useState } from "react";

/**
 * Guard padrão de hydration: retorna `false` no primeiro render (igual ao
 * servidor) e `true` depois que o componente montou no cliente. Use antes de
 * ler `localStorage`/`window`/qualquer estado que só existe no browser (ex.:
 * contadores de carrinho/wishlist, tema, sessão mockada), pra o HTML do
 * servidor bater com o do cliente e o React não acusar mismatch.
 *
 * O `setState` síncrono dentro do efeito é intencional aqui — é exatamente o
 * "avise-me quando o cliente montar" que a regra `react-hooks/set-state-in-effect`
 * normalmente desencoraja, mas não há outra forma de expressar esse guard em
 * um Client Component sem introduzir um flash de conteúdo incorreto.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard de hydration, ver doc acima
  useEffect(() => setMounted(true), []);
  return mounted;
}
