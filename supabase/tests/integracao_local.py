"""Contrato HTTP e concorrência. Destino fixo local; fixtures ficam só neste banco."""
import json
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "http://127.0.0.1:54321"
SERVICE = os.environ["LOCAL_SERVICE_ROLE"]
ANON = os.environ["LOCAL_ANON_KEY"]

def req(path, data=None, token=SERVICE, method=None):
    r = Request(BASE + path, data=json.dumps(data).encode() if data is not None else None,
                method=method, headers={"apikey": ANON if token != SERVICE else SERVICE,
                "Authorization": "Bearer " + token, "Content-Type": "application/json",
                "Prefer": "return=representation", "Origin": "http://127.0.0.1:4321"})
    try:
        with urlopen(r, timeout=45) as response:
            body = response.read()
            return response.status, json.loads(body) if body else None
    except HTTPError as e:
        return e.code, json.loads(e.read())

def ok(path, data=None, token=SERVICE, method=None):
    code, result = req(path, data, token, method)
    assert code < 300, (path, code, result)
    return result

email = f"api-{uuid.uuid4()}@example.invalid"
password = str(uuid.uuid4())
user = ok("/auth/v1/admin/users", {"email": email, "password": password, "email_confirm": True})
ok("/rest/v1/user_roles", {"user_id": user["id"], "role": "admin"})
token = ok("/auth/v1/token?grant_type=password", {"email": email, "password": password}, ANON)["access_token"]
categories = ok("/rest/v1/categorias_financeiras?ativo=eq.true")
entry_cat = next(x["id"] for x in categories if x["tipo"] == "entrada")
exit_cat = next(x["id"] for x in categories if x["tipo"] == "saida")
payload = {"p_operacao_id": str(uuid.uuid4()), "p_tipo": "salvar", "p_dados": {
    "p_tipo": "entrada", "p_valor": 100, "p_categoria_id": entry_cat,
    "p_mes_caixa": "2026-10-01", "p_data": "2026-10-23", "p_descricao": "Teste concorrência local"}}
with ThreadPoolExecutor(max_workers=2) as pool:
    ids = list(pool.map(lambda _: ok("/rest/v1/rpc/executar_movimento_its", payload, token), range(2)))
assert ids[0] == ids[1], ids
def refund(_):
    return req("/rest/v1/rpc/executar_movimento_its", {"p_operacao_id": str(uuid.uuid4()), "p_tipo": "devolver", "p_dados": {
        "p_entrada_id": ids[0], "p_valor": 70, "p_data": "2026-10-23", "p_categoria_id": exit_cat}}, token)
with ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(refund, range(2)))
assert sum(code < 300 for code, _ in results) == 1, results
assert len(ok("/rest/v1/lancamentos_financeiros?estorno_de_id=eq." + ids[0])) == 1
assert req("/rest/v1/rpc/executar_movimento_its", payload, ANON)[0] >= 400
assert ok("/rest/v1/lancamentos_financeiros?select=id", token=ANON) == []
assert not ok("/storage/v1/bucket/comprovantes")["public"]
print("PASS: repetição simultânea, limite simultâneo de devolução, acesso anônimo e bucket privado", flush=True)

courses = ok("/rest/v1/cursos?select=*")
for course in courses:
    ok("/rest/v1/cursos?id=eq." + course["id"], {"ativo": True, "publico": True, "taxa_matricula": 40, "mensalidade_referencia": 150}, method="PATCH")
event = ok("/rest/v1/edicoes_simposio", {"nome": "Simpósio HTTP local", "ativo": True, "publico": True, "valor": 50})[0]
def cpf():
    digits = [int(c) for c in str(uuid.uuid4().int)[:9]]
    for size in (9, 10):
        d = sum(digits[n] * (size + 1 - n) for n in range(size)) * 10 % 11
        digits.append(0 if d == 10 else d)
    return "".join(map(str, digits))
for activity in [{"destino": "curso", "curso_codigo": "teologico"}, {"destino": "curso", "curso_codigo": "capacitacao_obreiros"}, {"destino": "simposio", "edicao_simposio_id": event["id"]}]:
    identity = cpf()
    body = {"nome_completo": "Teste contrato público", "cpf": identity, "telefone": "11999999999",
            "email": email, "data_nascimento": "1990-01-01", "escolaridade": "medio", "modalidade": "correspondencia",
            "valor_referencia": 999, **activity}
    ok("/functions/v1/criar-inscricao", body, ANON)
    registration = ok("/rest/v1/inscricoes?cpf=eq." + identity)[0]
    assert registration["valor_referencia"] == (50 if activity["destino"] == "simposio" else 40)
    assert registration["status"] == "em_analise"
    assert ok("/rest/v1/lancamentos_financeiros?inscricao_id=eq." + registration["id"]) == []
print("PASS: inscrição pública nos dois cursos e Simpósio, preço do servidor e nenhum movimento automático", flush=True)
