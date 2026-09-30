CREATE TABLE perfil(
    id_perfil SERIAL PRIMARY KEY,
    nome_perfil VARCHAR(30) NOT NULL
);

CREATE TABLE equipe(
    id_equipe SERIAL PRIMARY KEY,
    nome_equipe VARCHAR(20) NOT NULL,
    status_equipe BOOLEAN NOT NULL
);
CREATE TABLE colaboradores(
    id_colaborador_atendente SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    id_perfil INTEGER,
    email VARCHAR(30) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    id_equipe INTEGER,

    CONSTRAINT fk_colaborador_perfil
        FOREIGN KEY (id_perfil)
        REFERENCES perfil(id_perfil),

    CONSTRAINT fk_colaborador_equipe
        FOREIGN KEY (id_equipe)
        REFERENCES equipe(id_equipe)
);

CREATE TABLE comunicante(
    id_comunicante SERIAL PRIMARY KEY,
    nome VARCHAR(50),
    telefone VARCHAR(15)
);

CREATE TABLE animal(
    id_animal SERIAL PRIMARY KEY,
    tipo_animal VARCHAR(20),
    especie VARCHAR(20),
    estado_saude VARCHAR(20)
);

CREATE TABLE instituicao_parceira(
    id_instituicao SERIAL PRIMARY KEY,
    nome_instituicao VARCHAR(30),
    telefone VARCHAR(11),
    endereco_instituicao VARCHAR(100)
);

CREATE TABLE ocorrencia(
    id_ocorrencia SERIAL PRIMARY KEY,
    protocolo VARCHAR(15) NOT NULL,
    status VARCHAR(15) NOT NULL,
    dt_ocorrencia DATE NOT NULL,
    urgencia VARCHAR(15) NOT NULL,
    desc_ocorrencia VARCHAR(200) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    ponto_referencia VARCHAR(50),
    endereco_ocorrencia VARCHAR(100),

    id_instituicao INTEGER,
    id_comunicante INTEGER,
    id_colaborador_atendente INTEGER,
    id_equipe INTEGER,
    id_animal INTEGER,

    CONSTRAINT fk_ocorrencia_instituicao
        FOREIGN KEY (id_instituicao)
        REFERENCES instituicao_parceira(id_instituicao),

    CONSTRAINT fk_ocorrencia_comunicante
        FOREIGN KEY (id_comunicante)
        REFERENCES comunicante(id_comunicante),

    CONSTRAINT fk_ocorrencia_colaborador
        FOREIGN KEY (id_colaborador_atendente)
        REFERENCES colaboradores(id_colaborador_atendente),

    CONSTRAINT fk_ocorrencia_equipe
        FOREIGN KEY (id_equipe)
        REFERENCES equipe(id_equipe),

    CONSTRAINT fk_ocorrencia_animal
        FOREIGN KEY (id_animal)
        REFERENCES animal(id_animal)
);

CREATE TABLE anexo_midia(
    id_midia SERIAL PRIMARY KEY,
    tipo_midia VARCHAR(30),
    url_midia VARCHAR(255),
    id_ocorrencia INTEGER NOT NULL,
    data_midia DATE,

    CONSTRAINT fk_midia_ocorrencia
        FOREIGN KEY (id_ocorrencia)
        REFERENCES ocorrencia(id_ocorrencia)
);

CREATE TABLE relatorio(
    id_relatorio SERIAL PRIMARY KEY,
    id_ocorrencia INTEGER NOT NULL UNIQUE,
    status VARCHAR(30),

    CONSTRAINT fk_relatorio_ocorrencia
        FOREIGN KEY (id_ocorrencia)
        REFERENCES ocorrencia(id_ocorrencia)
);