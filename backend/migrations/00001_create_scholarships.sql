-- +goose Up
CREATE TABLE scholarships (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    organizer text NOT NULL,
    country text NOT NULL,
    education_level text NOT NULL,
    funding_type text NOT NULL,
    deadline date,
    description text NOT NULL,
    requirements text NOT NULL,
    funding_details text NOT NULL,
    official_url text NOT NULL
);

-- +goose Down
DROP TABLE scholarships;
