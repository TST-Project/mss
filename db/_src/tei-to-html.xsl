<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst exsl">

<xsl:import href="lib/xslt/copy.xsl"/>
<xsl:import href="lib/xslt/functions.xsl"/>
<xsl:import href="lib/xslt/definitions.xsl"/>
<xsl:import href="lib/xslt/common.xsl"/>
<xsl:import href="lib/xslt/teiheader.xsl"/>
<xsl:import href="lib/xslt/transcription.xsl"/>
<xsl:import href="lib/xslt/apparatus.xsl"/>

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:param name="root">https://tst-project.github.io/lib/</xsl:param>

<xsl:template name="TEI">
    <xsl:element name="html">
        <xsl:element name="body">
            <xsl:attribute name="lang">en</xsl:attribute>   
            <xsl:element name="div">
                <xsl:attribute name="id">recordcontainer</xsl:attribute>
                <xsl:element name="div">
                    <xsl:element name="article">
                        <xsl:apply-templates/>
                    </xsl:element>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:element>
</xsl:template>

</xsl:stylesheet>
