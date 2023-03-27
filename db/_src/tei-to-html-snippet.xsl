<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst">

<xsl:import href="lib/xslt/copy.xsl"/>
<xsl:import href="lib/xslt/functions.xsl"/>
<xsl:import href="lib/xslt/definitions.xsl"/>
<xsl:import href="lib/xslt/common.xsl"/>
<xsl:import href="lib/xslt/teiheader.xsl"/>
<xsl:import href="lib/xslt/transcription.xsl"/>
<xsl:import href="lib/xslt/apparatus.xsl"/>
<!--xsl:import href="../lib/xslt/tei-to-html.xsl"/-->

<!-- these imports are compiled by Javascript, since WebKit's XSLTProcessor() doesn't play well with it -->

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:template match="/x:title | /x:seg | /x:colophon | /x:desc">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:if test="@class">
            <xsl:attribute name="class"><xsl:value-of select="@class"/></xsl:attribute>
        </xsl:if>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:span[@class='gaiji-selected']">
    <xsl:element name="span">
        <xsl:attribute name="class">gaiji-selected</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

</xsl:stylesheet>
