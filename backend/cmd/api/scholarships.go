package main

import (
	"net/http"

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
			ORDER BY title, id`
		cards := make([]scholarshipCard, 0)
		if err := db.SelectContext(c.Request.Context(), &cards, query); err != nil {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load scholarships"})
			return
		}
		c.JSON(http.StatusOK, cards)
	}
}
