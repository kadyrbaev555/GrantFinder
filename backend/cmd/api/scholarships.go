package main

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

const cardColumns = `id, title, organizer, country, education_level, funding_type,
	to_char(deadline, 'YYYY-MM-DD') AS deadline`

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
			SELECT ` + cardColumns + `
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

type scholarshipDetails struct {
	scholarshipCard
	Description    string `json:"description"`
	Requirements   string `json:"requirements"`
	FundingDetails string `db:"funding_details" json:"funding_details"`
	OfficialURL    string `db:"official_url" json:"official_url"`
}

func getScholarship(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 63)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scholarship ID"})
			return
		}

		const query = `SELECT ` + cardColumns + `, description, requirements, funding_details, official_url
			FROM scholarships WHERE id = $1`
		var details scholarshipDetails
		err = db.GetContext(c.Request.Context(), &details, query, id)
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "scholarship not found"})
			return
		}
		if err != nil {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load scholarship"})
			return
		}
		c.JSON(http.StatusOK, details)
	}
}
