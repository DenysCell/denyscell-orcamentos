"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Peca = {
  id: string;
  modelo: string;
  tipo: string;
  preco: number;
  link: string;
  fornecedor: string;
};

const SENHA_ADMIN = "05082026";

const pecasIniciais: Peca[] = [
  {
    id: "1",
    modelo: "iPhone 11",
    tipo: "Incell",
    preco: 185,
    link: "https://www.mercadolivre.com.br/",
    fornecedor: "Mercado Livre",
  },
];

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

export default function Home() {
  const [aba, setAba] = useState<"orcamento" | "cadastro">("orcamento");
  const [pecas, setPecas] = useState<Peca[]>(pecasIniciais);
  const [pesquisa, setPesquisa] = useState("");
  const [maoDeObra, setMaoDeObra] = useState(150);
  const [pesquisou, setPesquisou] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [modelo, setModelo] = useState("");
  const [tipo, setTipo] = useState("Incell");
  const [preco, setPreco] = useState("");
  const [link, setLink] = useState("");
  const [fornecedor, setFornecedor] = useState("Mercado Livre");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [adminLiberado, setAdminLiberado] = useState(false);

  useEffect(() => {
    const salvas = localStorage.getItem("denyscell-pecas");
    if (salvas) {
      try {
        setPecas(JSON.parse(salvas));
      } catch {
        setPecas(pecasIniciais);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("denyscell-pecas", JSON.stringify(pecas));
  }, [pecas]);

  const resultados = useMemo(() => {
    if (!pesquisou || !pesquisa.trim()) return [];
    const busca = normalizar(pesquisa);
    return pecas.filter((peca) => normalizar(peca.modelo).includes(busca));
  }, [pecas, pesquisa, pesquisou]);

  function buscar(event?: FormEvent) {
    event?.preventDefault();
    setPesquisou(true);
    setCopiado(false);
  }

  function abrirCadastro() {
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

  function bloquearCadastro() {
    setAdminLiberado(false);
    setAba("orcamento");
  }

  function cadastrarPeca(event: FormEvent) {
    event.preventDefault();

    if (!modelo.trim() || !tipo.trim() || !preco) {
      alert("Preencha modelo, tipo e preço.");
      return;
    }

    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Digite um preço válido.");
      return;
    }

    setPecas((anteriores) => [
      ...anteriores,
      {
        id: crypto.randomUUID(),
        modelo: modelo.trim(),
        tipo: tipo.trim(),
        preco: valor,
        link: link.trim(),
        fornecedor: fornecedor.trim() || "Não informado",
      },
    ]);

    setModelo("");
    setTipo("Incell");
    setPreco("");
    setLink("");
    setFornecedor("Mercado Livre");
    alert("Peça cadastrada com sucesso!");
  }

  function excluirPeca(id: string) {
    if (window.confirm("Deseja excluir esta peça?")) {
      setPecas((anteriores) => anteriores.filter((peca) => peca.id !== id));
    }
  }

  function montarMensagem() {
    if (!resultados.length) return "";

    return [
      "📱 *DenysCell Assistência Técnica*",
      "",
      `Orçamento para *${resultados[0].modelo}*:`,
      "",
      ...resultados.map(
        (peca) =>
          `• Tela ${peca.tipo}: *${dinheiro(peca.preco + maoDeObra)}*`
      ),
      "",
      `✅ Mão de obra incluída: ${dinheiro(maoDeObra)}`,
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
                ? "bg-red-600"
                : "border border-red-700 bg-black text-red-500 hover:bg-red-950/30"
            }`}
          >
            🔎 Fazer orçamento
          </button>

          <button
            onClick={abrirCadastro}
            className={`rounded-2xl border p-4 text-lg font-black transition ${
              aba === "cadastro"
                ? "bg-red-600"
                : "border border-red-700 bg-black text-red-500 hover:bg-red-950/30"
            }`}
          >
            🔒 Cadastrar peça
          </button>
        </div>

        {aba === "orcamento" && (
          <>
            <section className="rounded-3xl border border-red-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/30">
              <form onSubmit={buscar}>
                <label className="font-bold">Modelo do aparelho</label>
                <input
                  value={pesquisa}
                  onChange={(event) => {
                    setPesquisa(event.target.value);
                    setPesquisou(false);
                  }}
                  placeholder="Ex.: iPhone 11"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />

                <label className="mt-5 block font-bold">Mão de obra</label>
                <input
                  type="number"
                  min="0"
                  value={maoDeObra}
                  onChange={(event) => setMaoDeObra(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />

                <button className="mt-5 w-full rounded-xl bg-red-600 p-4 text-lg font-black hover:bg-red-500">
                  🔎 Buscar orçamento
                </button>
              </form>
            </section>

            {pesquisou && resultados.length === 0 && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-5 text-center text-red-300">
                Modelo não encontrado. Cadastre a peça primeiro.
              </div>
            )}

            {resultados.length > 0 && (
              <section className="mt-6 space-y-4">
                {resultados.map((peca) => (
                  <article
                    key={peca.id}
                    className="rounded-2xl border border-red-950 bg-zinc-950 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-bold text-red-400">
                          {peca.modelo}
                        </p>
                        <h2 className="mt-1 text-xl font-black">
                          Tela {peca.tipo}
                        </h2>
                        <p className="mt-2 text-zinc-400">
                          Peça: {dinheiro(peca.preco)}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Fornecedor: {peca.fornecedor}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm text-zinc-400">
                          Valor para o cliente
                        </p>
                        <p className="text-3xl font-black text-green-400">
                          {dinheiro(peca.preco + maoDeObra)}
                        </p>
                      </div>
                    </div>

                    {peca.link && (
                      <a
                        href={peca.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 block rounded-xl bg-yellow-500 p-3 text-center font-black text-black"
                      >
                        🛒 Comprar esta peça
                      </a>
                    )}
                  </article>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={copiarOrcamento}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-bold"
                  >
                    {copiado ? "✅ Orçamento copiado" : "📋 Copiar orçamento"}
                  </button>

                  <button
                    onClick={abrirWhatsApp}
                    className="rounded-xl bg-green-600 p-4 font-bold"
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
                <h2 className="text-2xl font-black text-red-400">
                  Cadastrar nova tela
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Área protegida por senha
                </p>
              </div>

              <button
                onClick={bloquearCadastro}
                className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 font-bold text-red-300"
              >
                🔒 Bloquear área
              </button>
            </div>

            <form onSubmit={cadastrarPeca} className="mt-6 space-y-4">
              <div>
                <label className="font-bold">Modelo do aparelho</label>
                <input
                  value={modelo}
                  onChange={(event) => setModelo(event.target.value)}
                  placeholder="Ex.: iPhone 11"
                  className="mt-2 w-full rounded-xl border border-red-800 bg-black p-4 outline-none focus:border-red-500"
                />
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
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  placeholder="Ex.: 185"
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

              <button className="w-full rounded-xl bg-green-600 p-4 font-bold">
                💾 Salvar peça
              </button>
            </form>

            <div className="mt-10">
              <h3 className="text-xl font-black">
                Peças cadastradas ({pecas.length})
              </h3>

              <div className="mt-4 space-y-3">
                {pecas.map((peca) => (
                  <div
                    key={peca.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-black p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-black">
                        {peca.modelo} — {peca.tipo}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {dinheiro(peca.preco)} · {peca.fornecedor}
                      </p>
                    </div>

                    <button
                      onClick={() => excluirPeca(peca.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 font-bold"
                    >
                      Excluir
                    </button>
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
            className="w-full max-w-sm rounded-3xl border border-red-950 bg-zinc-950 p-6"
          >
            <div className="text-center text-4xl">🔒</div>
            <h2 className="mt-3 text-center text-2xl font-black">
              Área administrativa
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              Digite a senha para cadastrar peças.
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
              <p className="mt-3 text-center font-bold text-red-400">
                {erroSenha}
              </p>
            )}

            <button className="mt-5 w-full rounded-xl bg-red-600 p-4 font-bold">
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setMostrarSenha(false)}
              className="mt-3 w-full rounded-xl border border-zinc-700 p-4 font-bold text-zinc-400"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}
    </main>
  );
}