package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

type scholarshipCard struct {
	ID             int64   `json:"id"`
	Title          string  `json:"title"`
	Organizer      string  `json:"organizer"`
	Country        string  `json:"country"`
	EducationLevel string  `db:"education_level" json:"education_level"`
	FundingType    string  `db:"funding_type" json:"funding_type"`
	Deadline       *string `json:"deadline"`
}

func listScholarships(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		const query = `
			SELECT id, title, organizer, country, education_level, funding_type,
			       to_char(deadline, 'YYYY-MM-DD') AS deadline
			FROM scholarships
			WHERE ($1::text = '' OR strpos(lower(title COLLATE "und-x-icu"), lower($1 COLLATE "und-x-icu")) > 0)
			  AND ($2::text = '' OR country = $2)
			  AND ($3::text = '' OR $3 = ANY(string_to_array(education_level, ', ')))
			  AND ($4::text = '' OR funding_type = $4)
			ORDER BY title, id`
		cards := make([]scholarshipCard, 0)
		err := db.SelectContext(c.Request.Context(), &cards, query,
			strings.TrimSpace(c.Query("q")),
			strings.TrimSpace(c.Query("country")),
			strings.TrimSpace(c.Query("education_level")),
			strings.TrimSpace(c.Query("funding_type")),
		)
		if err != nil {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load scholarships"})
			return
		}
		c.JSON(http.StatusOK, cards)
	}
}
