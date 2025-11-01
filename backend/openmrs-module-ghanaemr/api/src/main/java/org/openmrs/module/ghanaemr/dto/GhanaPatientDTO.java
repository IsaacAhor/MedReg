package org.openmrs.module.ghanaemr.dto;

import java.util.Date;

public class GhanaPatientDTO {
    private String ghanaCard;
    private String nhisNumber; // optional
    private String givenName;
    private String middleName; // optional
    private String familyName;
    private Date dateOfBirth;
    private String gender; // M, F, O
    private String phone; // optional, +233XXXXXXXXX
    private String regionCode; // e.g., GA
    private String facilityCode; // e.g., KBTH

    public String getGhanaCard() { return ghanaCard; }
    public void setGhanaCard(String ghanaCard) { this.ghanaCard = ghanaCard; }

    public String getNhisNumber() { return nhisNumber; }
    public void setNhisNumber(String nhisNumber) { this.nhisNumber = nhisNumber; }

    public String getGivenName() { return givenName; }
    public void setGivenName(String givenName) { this.givenName = givenName; }

    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }

    public String getFamilyName() { return familyName; }
    public void setFamilyName(String familyName) { this.familyName = familyName; }

    public Date getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }
}

