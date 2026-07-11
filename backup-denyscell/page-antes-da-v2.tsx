"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Peca = {
  id: number;
  marca: string;
  modelo: string;
  tipo: string;
  preco: number;
  link: string;
  fornecedor: string;
};

const SENHA_ADMIN = "1998";
const MAO_DE_OBRA = 150;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function ordenarTexto(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

export default function Home() {
  const [aba, setAba] = useState<"orcamento" | "cadastro">("orcamento");
  const [pecas, setPecas] = useState<Peca[]>([]);

  const [pesquisa, setPesquisa] = useState("");
  const [pesquisou, setPesquisou] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [novoModelo, setNovoModelo] = useState(true);
  const [tipo, setTipo] = useState("Incell");
  const [preco, setPreco] = useState("");
  const [link, setLink] = useState("");
  const [fornecedor, setFornecedor] = useState("Mercado Livre");
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [adminLiberado, setAdminLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroBanco, setErroBanco] = useState("");

  const carregarPecas = useCallback(async () => {
    setCarregando(true);
    setErroBanco("");

    const { data, error } = await supabase
      .from("pecas")
      .select("id, marca, modelo, tipo, preco, link, fornecedor")
      .order("marca", { ascending: true })
      .order("modelo", { ascending: true })
      .order("tipo", { ascending: true });

    if (error) {
      console.error(error);
      setErroBanco("Não foi possível carregar as peças online.");
      setCarregando(false);
      return;
    }

    setPecas(
      (data ?? []).map((peca) => ({
        id: Number(peca.id),
        marca: String(peca.marca ?? "Sem marca"),
        modelo: String(peca.modelo ?? ""),
        tipo: String(peca.tipo ?? ""),
        preco: Number(peca.preco ?? 0),
        link: String(peca.link ?? ""),
        fornecedor: String(peca.fornecedor ?? ""),
      }))
    );

    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregarPecas();
  }, [carregarPecas]);

  const marcas = useMemo(
    () =>
      Array.from(
        new Set(pecas.map((peca) => peca.marca.trim()).filter(Boolean))
      ).sort(ordenarTexto),
    [pecas]
  );

  const modelosDaMarca = useMemo(
    () =>
      Array.from(
        new Set(
          pecas
            .filter((peca) => normalizar(peca.marca) === normalizar(marca))
            .map((peca) => peca.modelo.trim())
            .filter(Boolean)
        )
      ).sort(ordenarTexto),
    [pecas, marca]
  );

  const resultados = useMemo(() => {
    if (!pesquisou || !pesquisa.trim()) return [];

    const busca = normalizar(pesquisa);

    return pecas.filter((peca) =>
      normalizar(`${peca.marca} ${peca.modelo}`).includes(busca)
    );
  }, [pecas, pesquisa, pesquisou]);

  function buscar(event?: FormEvent) {
    event?.preventDefault();
    setPesquisou(true);
    setCopiado(false);
  }

  function abrirAdministracao() {
    if (adminLiberado) {
      setAba("cadastro");
      return;
    }

    setSenhaDigitada("");
    setErroSenha("");
    setMostrarSenha(true);
  }

  function confirmarSenha(event: FormEvent) {
    event.preventDefault();

    if (senhaDigitada === SENHA_ADMIN) {
      setAdminLiberado(true);
      setMostrarSenha(false);
      setSenhaDigitada("");
      setErroSenha("");
      setAba("cadastro");
    } else {
      setErroSenha("Senha incorreta.");
    }
  }

  function bloquearAdministracao() {
    setAdminLiberado(false);
    setAba("orcamento");
    limparFormulario();
  }

  function limparFormulario() {
    setIdEmEdicao(null);
    setMarca("");
    setModelo("");
    setNovoModelo(true);
    setTipo("Incell");
    setPreco("");
    setLink("");
    setFornecedor("Mercado Livre");
  }

  function escolherMarca(valor: string) {
    setMarca(valor);
    setModelo("");
    setNovoModelo(false);
  }

  function ativarNovoModelo() {
    setModelo("");
    setNovoModelo(true);
  }

  function editarPeca(peca: Peca) {
    setIdEmEdicao(peca.id);
    setMarca(peca.marca);
    setModelo(peca.modelo);
    setNovoModelo(true);
    setTipo(peca.tipo);
    setPreco(String(peca.preco));
    setLink(peca.link);
    setFornecedor(peca.fornecedor);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function duplicarPeca(peca: Peca) {
    setIdEmEdicao(null);
    setMarca(peca.marca);
    setModelo(peca.modelo);
    setNovoModelo(true);
    setTipo(peca.tipo);
    setPreco(String(peca.preco));
    setLink(peca.link);
    setFornecedor(peca.fornecedor);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarPeca(event: FormEvent) {
    event.preventDefault();

    if (!marca.trim() || !modelo.trim() || !tipo.trim() || !preco) {
      alert("Preencha marca, modelo, tipo e preço.");
      return;
    }

    const valor = Number(preco.replace(",", "."));

    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Digite um preço válido.");
      return;
    }

    const dados = {
      marca: marca.trim(),
      modelo: modelo.trim(),
      tipo: tipo.trim(),
      preco: valor,
      link: link.trim(),
      fornecedor: fornecedor.trim() || "Não informado",
    };

    setSalvando(true);
    setErroBanco("");

    const resposta = idEmEdicao
      ? await supabase.from("pecas").update(dados).eq("id", idEmEdicao)
      : await supabase.from("pecas").insert(dados);

    if (resposta.error) {
      console.error(resposta.error);
      setErroBanco(
        idEmEdicao
          ? "Não foi possível atualizar a peça online."
          : "Não foi possível salvar a peça online."
      );
      setSalvando(false);
      return;
    }

    const mensagem = idEmEdicao
      ? "Peça atualizada online com sucesso!"
      : "Peça cadastrada online com sucesso!";

    limparFormulario();
    await carregarPecas();
    setSalvando(false);
    alert(mensagem);
  }

  async function excluirPeca(id: number) {
    const confirmou = window.confirm("Deseja excluir esta peça?");
    if (!confirmou) return;

    setErroBanco("");

    const { error } = await supabase.from("pecas").delete().eq("id", id);

    if (error) {
      console.error(error);
      setErroBanco("Não foi possível excluir a peça online.");
      return;
    }

    if (idEmEdicao === id) limparFormulario();
    await carregarPecas();
  }

  function montarMensagem() {
    if (!resultados.length) return "";

    const aparelho = `${resultados[0].marca} ${resultados[0].modelo}`.trim();

    return [
      "📱 *DenysCell Assistência Técnica*",
      "",
      `Orçamento para *${aparelho}*:`,
      "",
      ...resultados.map(
        (peca) =>
          `• Tela ${peca.tipo}: *${dinheiro(peca.preco + MAO_DE_OBRA)}*`
      ),
      "",
      "✅ Garantia de 90 dias para o serviço.",
      "Valores sujeitos à disponibilidade da peça.",
    ].join("\n");
  }

  async function copiarOrcamento() {
    const texto = montarMensagem();
    if (!texto) return;

    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function abrirWhatsApp() {
    const texto = montarMensagem();
    if (!texto) return;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <img
            src="/logo.png"
            alt="DenysCell"
            className="mx-auto w-full max-w-2xl object-contain"
          />
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => setAba("orcamento")}
            className={`rounded-2xl border p-4 text-lg font-black transition ${
              aba === "orcamento"
                ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/40"
                : "border-red-700 bg-black text-red-500 hover:bg-red-950/30"
            }`}
          >
            🔎 Fazer orçamento
          </button>

          <button
            onClick={abrirAdministracao}
            className={`rounded-2xl border p-4 text-lg font-black transition ${
              aba === "cadastro"
                ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/40"
                : "border-red-700 bg-black text-red-500 hover:bg-red-950/30"
            }`}
          >
            🔒 Área administrativa
          </button>
        </div>

        {aba === "orcamento" && (
          <>
            <section className="rounded-3xl border border-red-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/30">
              <form onSubmit={buscar}>
                <label className="font-bold">Marca ou modelo do aparelho</label>

                <input
                  value={pesquisa}
                  onChange={(event) => {
                    setPesquisa(event.target.value);
                    setPesquisou(false);
                  }}
                  placeholder="Ex.: Motorola G54 ou apenas G54"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />

                <button className="mt-5 w-full rounded-xl bg-red-600 p-4 text-lg font-black transition hover:bg-red-500">
                  🔎 Buscar orçamento
                </button>
              </form>
            </section>

            {carregando && (
              <div className="mt-5 rounded-xl border border-red-900 bg-zinc-950 p-5 text-center text-zinc-300">
                Carregando peças online...
              </div>
            )}

            {erroBanco && (
              <div className="mt-5 rounded-xl border border-red-500/40 bg-red-950/40 p-5 text-center text-red-300">
                {erroBanco}
              </div>
            )}

            {pesquisou && !carregando && resultados.length === 0 && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-5 text-center text-red-300">
                Modelo não encontrado. Cadastre a peça primeiro.
              </div>
            )}

            {resultados.length > 0 && (
              <section className="mt-6 space-y-4">
                {resultados.map((peca) => (
                  <article
                    key={peca.id}
                    className="rounded-2xl border border-red-900 bg-zinc-950 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-bold text-red-400">
                          {peca.marca} {peca.modelo}
                        </p>

                        <h2 className="mt-1 text-xl font-black">Tela {peca.tipo}</h2>

                        <p className="mt-2 text-zinc-400">Peça: {dinheiro(peca.preco)}</p>

                        <p className="text-sm text-zinc-500">
                          Fornecedor: {peca.fornecedor}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm text-zinc-400">Valor para o cliente</p>

                        <p className="text-3xl font-black text-green-400">
                          {dinheiro(peca.preco + MAO_DE_OBRA)}
                        </p>
                      </div>
                    </div>

                    {peca.link && (
                      <a
                        href={peca.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 block rounded-xl bg-yellow-500 p-3 text-center font-black text-black hover:bg-yellow-400"
                      >
                        🛒 Comprar esta peça
                      </a>
                    )}
                  </article>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={copiarOrcamento}
                    className="rounded-xl border border-red-800 bg-black p-4 font-bold text-red-400 hover:bg-red-950/30"
                  >
                    {copiado ? "✅ Orçamento copiado" : "📋 Copiar orçamento"}
                  </button>

                  <button
                    onClick={abrirWhatsApp}
                    className="rounded-xl bg-green-600 p-4 font-bold hover:bg-green-500"
                  >
                    📲 Abrir no WhatsApp
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {aba === "cadastro" && adminLiberado && (
          <section className="rounded-3xl border border-red-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/30">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-red-500">Área administrativa</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Cadastre, edite, duplique e exclua peças.
                </p>
              </div>

              <button
                onClick={bloquearAdministracao}
                className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 font-bold text-red-300"
              >
                🔒 Sair da área
              </button>
            </div>

            {idEmEdicao && (
              <div className="mt-6 rounded-xl border border-yellow-500/50 bg-yellow-950/30 p-4 text-yellow-200">
                ✏️ Você está editando uma peça cadastrada.
              </div>
            )}

            <form onSubmit={salvarPeca} className="mt-6 space-y-4">
              <div>
                <label className="font-bold">Marca</label>
                <input
                  list="lista-marcas"
                  value={marca}
                  onChange={(event) => escolherMarca(event.target.value)}
                  placeholder="Ex.: Motorola"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />
                <datalist id="lista-marcas">
                  {marcas.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="font-bold">Modelo do aparelho</label>
                  <button
                    type="button"
                    onClick={ativarNovoModelo}
                    className="rounded-lg border border-red-700 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950/40"
                  >
                    ➕ Novo modelo
                  </button>
                </div>

                {!novoModelo && modelosDaMarca.length > 0 ? (
                  <select
                    value={modelo}
                    onChange={(event) => setModelo(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                  >
                    <option value="">Selecione um modelo</option>
                    {modelosDaMarca.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={modelo}
                    onChange={(event) => setModelo(event.target.value)}
                    placeholder="Ex.: G54"
                    className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                  />
                )}

                {!novoModelo && modelosDaMarca.length === 0 && marca.trim() && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Nenhum modelo cadastrado nessa marca. Clique em “Novo modelo”.
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold">Tipo da tela</label>
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                >
                  <option>Incell</option>
                  <option>OLED</option>
                  <option>Original</option>
                  <option>Original nacional</option>
                  <option>Com aro</option>
                  <option>Sem aro</option>
                  <option>Outro</option>
                </select>
              </div>

              <div>
                <label className="font-bold">Preço da peça</label>
                <input
                  inputMode="decimal"
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  placeholder="Ex.: 185,00"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold">Fornecedor</label>
                <input
                  value={fornecedor}
                  onChange={(event) => setFornecedor(event.target.value)}
                  placeholder="Ex.: Mercado Livre"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold">Link para comprar</label>
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="Cole aqui o link do anúncio"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  disabled={salvando}
                  className="w-full rounded-xl bg-red-600 p-4 text-lg font-black hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando online..."
                    : idEmEdicao
                    ? "💾 Atualizar peça"
                    : "💾 Salvar peça"}
                </button>

                {idEmEdicao && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="w-full rounded-xl border border-red-800 bg-black p-4 text-lg font-black text-red-400 hover:bg-red-950/30"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>

            {erroBanco && (
              <div className="mt-5 rounded-xl border border-red-500/40 bg-red-950/40 p-5 text-center text-red-300">
                {erroBanco}
              </div>
            )}

            <div className="mt-10">
              <h3 className="text-xl font-black">Peças cadastradas ({pecas.length})</h3>

              <div className="mt-4 space-y-3">
                {pecas.map((peca) => (
                  <div
                    key={peca.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-red-900 bg-black p-4 lg:flex-row lg:items-center"
                  >
                    <div>
                      <p className="font-black">
                        {peca.marca} {peca.modelo} — {peca.tipo}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {dinheiro(peca.preco)} · {peca.fornecedor}
                      </p>
                      {peca.link && (
                        <a
                          href={peca.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-sm font-bold text-yellow-400 hover:underline"
                        >
                          Abrir link da peça
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => editarPeca(peca)}
                        className="rounded-lg bg-yellow-500 px-3 py-2 font-bold text-black hover:bg-yellow-400"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => duplicarPeca(peca)}
                        className="rounded-lg bg-zinc-700 px-3 py-2 font-bold hover:bg-zinc-600"
                      >
                        📋 Duplicar
                      </button>
                      <button
                        onClick={() => excluirPeca(peca.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 font-bold hover:bg-red-500"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-sm text-zinc-500">
          © 2026 <span className="text-red-500">DenysCell</span>
        </footer>
      </div>

      {mostrarSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <form
            onSubmit={confirmarSenha}
            className="w-full max-w-sm rounded-3xl border border-red-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/50"
          >
            <div className="text-center text-4xl">🔒</div>
            <h2 className="mt-3 text-center text-2xl font-black">Área administrativa</h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Digite a senha para continuar.
            </p>

            <input
              autoFocus
              type="password"
              value={senhaDigitada}
              onChange={(event) => {
                setSenhaDigitada(event.target.value);
                setErroSenha("");
              }}
              placeholder="Digite a senha"
              className="mt-6 w-full rounded-xl border border-red-800 bg-black p-4 text-center text-lg outline-none focus:border-red-500"
            />

            {erroSenha && (
              <p className="mt-3 text-center font-bold text-red-400">{erroSenha}</p>
            )}

            <button className="mt-5 w-full rounded-xl bg-red-600 p-4 font-bold hover:bg-red-500">
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setMostrarSenha(false)}
              className="mt-3 w-full rounded-xl border border-red-800 p-4 font-bold text-zinc-400"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
