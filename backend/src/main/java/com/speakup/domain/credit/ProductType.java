package com.speakup.domain.credit;

import java.math.BigDecimal;

/**
 * Tipos de produtos disponíveis para compra.
 */
public enum ProductType {
    // Sessões
    SESSION_SINGLE(1, CreditType.SESSION, new BigDecimal("15.00"), "1 Sessão", null),
    SESSION_PACK_5(5, CreditType.SESSION, new BigDecimal("67.50"), "5 Sessões", "10%"),
    SESSION_PACK_10(10, CreditType.SESSION, new BigDecimal("127.50"), "10 Sessões", "15%"),
    SESSION_PACK_20(20, CreditType.SESSION, new BigDecimal("240.00"), "20 Sessões", "20%"),

    // Conversas
    CONVERSATION_SINGLE(1, CreditType.CONVERSATION, new BigDecimal("3.00"), "1 Conversa", null),
    CONVERSATION_PACK_20(20, CreditType.CONVERSATION, new BigDecimal("54.00"), "20 Conversas", "10%"),
    CONVERSATION_PACK_50(50, CreditType.CONVERSATION, new BigDecimal("120.00"), "50 Conversas", "20%"),
    CONVERSATION_PACK_100(100, CreditType.CONVERSATION, new BigDecimal("210.00"), "100 Conversas", "30%");

    private final int credits;
    private final CreditType creditType;
    private final BigDecimal price;
    private final String displayName;
    private final String discount;

    ProductType(int credits, CreditType creditType, BigDecimal price, String displayName, String discount) {
        this.credits = credits;
        this.creditType = creditType;
        this.price = price;
        this.displayName = displayName;
        this.discount = discount;
    }

    public int getCredits() {
        return credits;
    }

    public CreditType getCreditType() {
        return creditType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDiscount() {
        return discount;
    }

    public BigDecimal getPricePerCredit() {
        return price.divide(BigDecimal.valueOf(credits), 2, java.math.RoundingMode.HALF_UP);
    }

    public boolean isPopular() {
        return this == SESSION_PACK_10 || this == CONVERSATION_PACK_50;
    }

    public boolean isBestValue() {
        return this == SESSION_PACK_20 || this == CONVERSATION_PACK_100;
    }
}
