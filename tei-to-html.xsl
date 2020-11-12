<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:my="https://github.com/chchch/tst"
                exclude-result-prefixes="x my">
<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:template match="x:TEI">
    <xsl:element name="html">
        <xsl:element name="head">
            <xsl:element name="meta">
                <xsl:attribute name="charset">utf-8</xsl:attribute>
            </xsl:element>
            <xsl:element name="title">
                <xsl:value-of select="//x:titleStmt/x:title"/>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href">lib/tufte.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href">lib/tst.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">lib/sanscript.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">lib/hypher-nojquery.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">lib/sa.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">lib/ta.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">https://unpkg.com/mirador@latest</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">lib/tst.js</xsl:attribute>
            </xsl:element>
        </xsl:element>
        <xsl:element name="body">
            <xsl:attribute name="lang">en</xsl:attribute>   
            <xsl:element name="div">
                <xsl:attribute name="id">recordcontainer</xsl:attribute>
                <xsl:element name="div">
                    <xsl:choose>
                        <xsl:when test="x:facsimile/x:graphic">
                            <xsl:attribute name="id">record-thin</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="id">record-fat</xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                    <div id="topbar">
                        <div id="transbutton" title="change script">A</div>
                    </div>
                    <xsl:element name="article">
                        <xsl:apply-templates/>
                    </xsl:element>
                </xsl:element>
            </xsl:element>
            <xsl:if test="x:facsimile/x:graphic">
                <xsl:element name="div">
                    <xsl:attribute name="id">viewer</xsl:attribute>
                    <xsl:attribute name="data-manifest">
                        <xsl:value-of select="x:facsimile/x:graphic/@url"/>
                    </xsl:attribute>
                </xsl:element>
            </xsl:if>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template name="lang">
    <xsl:if test="@xml:lang">
        <xsl:attribute name="lang"><xsl:value-of select="@xml:lang"/></xsl:attribute>
    </xsl:if>
</xsl:template>

<xsl:template match="x:teiHeader">
    <xsl:element name="section">
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:milestone">
    <xsl:element name="span">
        <xsl:attribute name="class">milestone</xsl:attribute>
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:apply-templates select="@facs"/>
        <xsl:choose>
        <xsl:when test="@unit">
            <xsl:value-of select="@unit"/>
            <xsl:text> </xsl:text>
        </xsl:when>
        <xsl:when test="/x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc[@form = 'pothi']">
            <xsl:text>folio </xsl:text>
        </xsl:when>
<xsl:when test="/x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc[@form = 'book']">
            <xsl:text>page </xsl:text>
        </xsl:when>
        </xsl:choose>
<xsl:value-of select="@n"/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:locus">
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>locus </xsl:text>
            <xsl:value-of select="@rend"/>
        </xsl:attribute>
        <xsl:apply-templates select="@facs"/>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="@facs">
    <xsl:attribute name="data-loc">
        <xsl:value-of select="."/>
    </xsl:attribute>
</xsl:template>

<xsl:template match="x:lb">
    <xsl:element name="span">
        <xsl:attribute name="class">lb</xsl:attribute>
        <xsl:apply-templates select="x:lb/@n"/>
        <xsl:text>&#x2424;</xsl:text>
    </xsl:element>
</xsl:template>

<xsl:template match="x:lb/@n">
    <xsl:attribute name="title">
        <xsl:value-of select="."/>
    </xsl:attribute>
</xsl:template>

<xsl:template match="x:sup">
    <xsl:element name="sup">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:sub">
    <xsl:element name="sub">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:quote">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">quote</xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:foreign">
    <xsl:element name="em">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:term">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">
            <xsl:text>term </xsl:text>
            <xsl:value-of select="@rend"/>
        </xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:titleStmt/x:title">
    <h1><xsl:apply-templates/></h1>
</xsl:template>
<xsl:template match="x:titleStmt/x:title[@type='alt']">
    <h3 style="font-style:italic"><xsl:apply-templates/></h3>
</xsl:template>

<xsl:template match="x:titleStmt/x:editor">
    <h4>Edited by <xsl:apply-templates/></h4>
</xsl:template>

<xsl:template match="x:titleStmt/x:respStmt">
    <p><xsl:apply-templates/></p>
</xsl:template>

<xsl:template match="x:respStmt/x:resp">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:respStmt/x:name">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:publicationStmt">
    <xsl:element name="p">
        <xsl:text>Published in </xsl:text>
        <xsl:apply-templates select="x:date"/>
        <xsl:text> by </xsl:text>
        <xsl:apply-templates select="x:publisher"/> 
        <xsl:if test="x:pubPlace">
            <xsl:text>in </xsl:text><xsl:apply-templates select="x:pubPlace"/>
        </xsl:if>
        <xsl:text>.</xsl:text>
    </xsl:element>
</xsl:template>

<xsl:template match="x:editionStmt">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:title">
    <xsl:element name="em">
        <xsl:attribute name="class">title</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:msContents/x:summary/x:title">
    <xsl:element name="em">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:msContents/x:summary/x:sub">
    <xsl:element name="sub">
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:msContents/x:summary/x:sup">
    <xsl:element name="sup">
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:msIdentifier">
    <table id="msidentifier">
        <xsl:apply-templates select="x:repository"/>
        <xsl:apply-templates select="x:institution"/>
        <xsl:apply-templates select="x:idno"/>
    </table>
</xsl:template>

<xsl:template match="x:repository">
    <tr><td colspan="2"><xsl:apply-templates/></td></tr>
</xsl:template>
<xsl:template match="x:institution">
    <tr><td colspan="2"><xsl:apply-templates/></td></tr>
</xsl:template>
<xsl:template match="x:orgName">
    <xsl:element name="span">
        <xsl:attribute name="class">orgname</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:idno[not(@type='URI')]">
    <tr><th>
        <xsl:if test="@type">
            <xsl:value-of select="@type"/>
        </xsl:if>
        </th>
        <td>
            <xsl:apply-templates/>
        </td>
    </tr>
</xsl:template>
<xsl:template match="x:idno[@type='URI']">
    <tr><td colspan="2">
        <xsl:element name="a">
            <xsl:attribute name="href"><xsl:value-of select="."/></xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </td></tr>
</xsl:template>

<xsl:template match="x:fileDesc">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:titleStmt">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:sourceDesc">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:msDesc">
    <xsl:apply-templates select="x:msIdentifier"/>
    <xsl:apply-templates select="x:msContents"/>
    <xsl:apply-templates select="x:physDesc"/>
    <section>
        <h3>Contents</h3>
        <xsl:apply-templates select="x:msContents/x:msItem"/>
    </section>
    <xsl:apply-templates select="x:history"/>
    <xsl:apply-templates select="x:additional"/>
</xsl:template>

<xsl:template match="x:msContents">
    <xsl:apply-templates select="x:summary"/>
</xsl:template>

<xsl:template match="x:msItem">
  <table class="msItem">
    <xsl:if test="@n">
        <xsl:element name="thead">
            <xsl:element name="tr">
                <xsl:element name="th">
                    <xsl:value-of select="@n"/>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:if>
    <xsl:apply-templates/>
  </table>
  <xsl:if test="not(position() = last())">
    <xsl:element name="hr"/>
  </xsl:if>
</xsl:template>

<xsl:template match="x:msItem/x:title[not(@type)]">
    <tr>
      <th>Title</th>
        <xsl:element name="td">
            <xsl:call-template name="lang"/>
            <xsl:apply-templates />
        </xsl:element>
    </tr>
</xsl:template>

<xsl:template match="x:msItem/x:title[@type='commentary']">
  <tr>
    <th>Commentary</th>
    <xsl:element name="td">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
  </tr>
</xsl:template>

<xsl:template match="x:msItem/x:author">
  <tr>
    <th>Author</th>
    <xsl:element name="td">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
  </tr>
</xsl:template>
<xsl:template match="x:msItem/x:author[@role='commentator']">
  <tr>
    <th>Commentator</th>
    <xsl:element name="td">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
  </tr>
</xsl:template>
<xsl:template match="x:msItem/x:textLang">
  <tr>
    <th>Language</th> 
    <td><xsl:apply-templates/>
    </td>
  </tr>
</xsl:template>

<xsl:template match="x:rubric">
   <tr>
     <th>Rubric</th>
     <xsl:element name="td">
        <xsl:attribute name="class">excerpt</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
     </xsl:element>
   </tr>
</xsl:template> 
<xsl:template match="x:finalRubric">
   <tr>
     <th>Final rubric</th>
     <xsl:element name="td">
        <xsl:attribute name="class">excerpt</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
     </xsl:element>
   </tr>
</xsl:template>
<xsl:template match="x:incipit">
   <tr>
     <th>Incipit</th>
     <xsl:element name="td">
        <xsl:attribute name="class">excerpt</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
     </xsl:element>
   </tr>
</xsl:template>
<xsl:template match="x:explicit">
   <tr>
     <th>Explicit</th>
     <xsl:element name="td">
        <xsl:attribute name="class">excerpt</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
     </xsl:element>
   </tr>
</xsl:template>
<xsl:template match="x:colophon">
   <tr>
     <th>Colophon</th>
     <xsl:element name="td">
        <xsl:attribute name="class">excerpt</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
     </xsl:element>
   </tr>
</xsl:template>

<xsl:template match="x:span">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:filiation">
    <tr>
        <th>Filiation</th>
        <xsl:element name="td">
            <xsl:apply-templates/>
        </xsl:element>
    </tr>
</xsl:template>

<xsl:template match="x:summary">
    <xsl:element name="section">
        <xsl:attribute name="id">summary</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:physDesc">
  <section>
      <h3>Physical description</h3>
      <table id="physDesc">
      <xsl:apply-templates select="x:objectDesc/@form"/>
      <xsl:apply-templates select="x:objectDesc/x:supportDesc/@material"/>
      <xsl:apply-templates select="x:objectDesc/x:supportDesc/x:extent"/>
      <xsl:if test="x:objectDesc/x:supportDesc/x:foliation">
          <tr>
            <th>Foliation</th>
            <td><ul>
              <xsl:apply-templates select="x:objectDesc/x:supportDesc/x:foliation"/>
            </ul></td>
          </tr>
      </xsl:if>
      <xsl:apply-templates select="x:objectDesc/x:supportDesc/x:condition"/>
      <xsl:apply-templates select="x:objectDesc/x:layoutDesc"/>
      <xsl:apply-templates select="x:handDesc"/>
      <xsl:apply-templates select="x:additions"/>
      <xsl:apply-templates select="x:bindingDesc"/>
      </table>
  </section>
</xsl:template>

<xsl:template match="x:textLang">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:scriptDesc">
    <ul>
    <xsl:apply-templates select="x:scriptNote"/>
    </ul>
</xsl:template>
<xsl:template match="x:scriptNote">
      <li><xsl:apply-templates/></li>
</xsl:template>

<xsl:template match="x:objectDesc/@form">
  <tr>
    <th>Format</th> <td><xsl:value-of select="."/></td>
  </tr>
</xsl:template>

<my:materials>
    <my:entry key="paper">Paper</my:entry>
    <my:entry key="palm-leaf">Palm leaf</my:entry>
    <my:entry key="birch-bark">Birch bark</my:entry>
    <my:entry key="leather">Leather</my:entry>
</my:materials>

<xsl:template match="x:objectDesc/x:supportDesc/@material">
  <xsl:variable name="mat" select="."/>
  <xsl:element name="tr">
    <xsl:element name="th">Material</xsl:element>
    <xsl:element name="td">
        <xsl:value-of select="document('')/*/my:materials/my:entry[@key=$mat]"/>
        <xsl:if test="../x:support">
            <xsl:text>. </xsl:text>
            <xsl:apply-templates select="../x:support"/>
        </xsl:if>
    </xsl:element>
  </xsl:element>
</xsl:template>

<xsl:template match="x:objectDesc/x:supportDesc/x:support">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:measure">
    <xsl:value-of select="@quantity"/>
    <xsl:text> </xsl:text>
    <xsl:value-of select="@unit"/>
    <xsl:text>. </xsl:text>
    <xsl:apply-templates />
</xsl:template>

<xsl:template match="x:measure[@unit='stringhole' or @unit='folio']">
    <xsl:variable select="@quantity" name="num"/>
    <xsl:value-of select="$num"/>
    <xsl:text> </xsl:text>
    <xsl:value-of select="@unit"/>
    <xsl:if test="$num &gt; 1">
        <xsl:text>s</xsl:text>
    </xsl:if>
    <xsl:text>. </xsl:text>
    <xsl:apply-templates />
</xsl:template>

<xsl:template match="x:objectDesc/x:supportDesc/x:extent">
  <tr>
    <th>Extent</th> 
    <td>
        <xsl:apply-templates select="x:measure"/>
    </td>
  </tr>
  <tr>
    <th>Dimensions</th>
    <td>
        <xsl:apply-templates select="x:dimensions"/>
    </td>
  </tr>
</xsl:template>

<xsl:template match="x:dimensions">
    <ul>
        <xsl:choose>
        <xsl:when test="@type">
            <li>
                <xsl:text>(</xsl:text><xsl:value-of select="@type"/><xsl:text>) </xsl:text>
                <ul>
                    <xsl:apply-templates select="x:width"/>
                    <xsl:apply-templates select="x:height"/>
                    <xsl:apply-templates select="x:depth"/>
                </ul>
            </li>
        </xsl:when>
        <xsl:otherwise>
            <xsl:apply-templates select="x:width"/>
            <xsl:apply-templates select="x:height"/>
            <xsl:apply-templates select="x:depth"/>
        </xsl:otherwise>
        </xsl:choose>
    </ul>
    <xsl:apply-templates select="x:note"/>
</xsl:template>

<xsl:template match="x:note">
    <xsl:element name="p">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:width">
    <xsl:element name="li">
        <xsl:text>width: </xsl:text>
        <xsl:apply-templates select="@quantity"/>
        <xsl:apply-templates select="@min"/>
        <xsl:apply-templates select="@max"/>
        <xsl:text> </xsl:text>
        <xsl:value-of select="../@unit"/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:height">
    <xsl:element name="li">
        <xsl:text>height: </xsl:text>
        <xsl:apply-templates select="@quantity"/>
        <xsl:apply-templates select="@min"/>
        <xsl:apply-templates select="@max"/>
        <xsl:text> </xsl:text>
        <xsl:value-of select="../@unit"/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:depth">
    <xsl:element name="li">
        <xsl:text>depth: </xsl:text>
        <xsl:apply-templates select="@quantity"/>
        <xsl:apply-templates select="@min"/>
        <xsl:apply-templates select="@max"/>
        <xsl:text> </xsl:text>
        <xsl:value-of select="../@unit"/>
    </xsl:element>
</xsl:template>

<xsl:template match="@quantity">
    <xsl:value-of select="."/>
    <xsl:text> </xsl:text>
</xsl:template>
<xsl:template match="@min">
    <xsl:text>min. </xsl:text>
    <xsl:value-of select="."/>
    <xsl:text> </xsl:text>
</xsl:template>
<xsl:template match="@max">
    <xsl:text>max. </xsl:text>
    <xsl:value-of select="."/>
    <xsl:text> </xsl:text>
</xsl:template>

<xsl:template name="n-format">
        <xsl:if test="@n">
            <xsl:element name="span">
                <xsl:attribute name="class">lihead</xsl:attribute>
                <xsl:call-template name="splitlist">
                    <xsl:with-param name="list" select="@n"/>
                    <xsl:with-param name="nocapitalize">true</xsl:with-param>
                </xsl:call-template>
            </xsl:element>
        </xsl:if>
        <xsl:text>: </xsl:text>
</xsl:template>

<xsl:template match="x:objectDesc/x:supportDesc/x:foliation">
    <li>
        <xsl:call-template name="n-format"/>
        <xsl:apply-templates />
    </li>
</xsl:template>

<xsl:template match="x:objectDesc/x:supportDesc/x:condition">
    <tr>
      <th>Condition</th> <td><xsl:apply-templates/></td>
    </tr>
</xsl:template>

<xsl:template match="x:objectDesc/x:layoutDesc">
  <tr>
    <th>Layout</th> 
    <td>
        <ul>
            <xsl:apply-templates/>
        </ul>
    </td>
  </tr>
</xsl:template>

<xsl:template match="x:layout">
    <li>
      <xsl:if test="@n">
        <xsl:element name="span">
            <xsl:attribute name="class">lihead</xsl:attribute>
            <xsl:value-of select="@n"/>
            <xsl:text>: </xsl:text>
        </xsl:element>
      </xsl:if>
      <xsl:if test="@writtenLines">
        <xsl:value-of select="translate(@writtenLines,' ','-')"/>
        <xsl:text> written lines per page. </xsl:text>
      </xsl:if>
      <xsl:if test="@ruledLines">
        <xsl:value-of select="translate(@ruledLines,' ','-')"/>
        <xsl:text> ruled lines per page. </xsl:text>
      </xsl:if>
      <xsl:apply-templates />
    </li>
</xsl:template>

<xsl:template match="x:handDesc">
    <tr>
      <th>Scribal Hands</th>
      <td><ul>
        <xsl:apply-templates select="x:handNote"/>
      </ul></td>
    </tr>
</xsl:template>

<xsl:template name="splitlist">
    <xsl:param name="list"/>
    <xsl:param name="nocapitalize"/>
    <xsl:param name="mss" select="$list"/>

        <xsl:if test="string-length($mss)">
            <xsl:if test="not($mss=$list)">, </xsl:if>
            <xsl:variable name="splitted" select="substring-before(
                                        concat($mss,' '),
                                      ' ')"/>
            <xsl:choose>
                <xsl:when test="$nocapitalize = 'true'">
                    <xsl:value-of select="$splitted"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:call-template name="capitalize">
                        <xsl:with-param name="str" select="$splitted"/>
                    </xsl:call-template>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:call-template name="splitlist">
                <xsl:with-param name="mss" select=
                    "substring-after($mss, ' ')"/>
            </xsl:call-template>
        </xsl:if>
</xsl:template>

<xsl:template name="capitalize">
    <xsl:param name="str"/>
    <xsl:variable name="LowerCase" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="UpperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    <xsl:value-of select="translate(
      substring($str,1,1),
      $LowerCase,
      $UpperCase
      )"/>
    <xsl:value-of select="substring($str,2,string-length($str)-1)"/>
</xsl:template>

<xsl:template match="x:handNote">
  <xsl:variable name="script" select="@script"/>
  <li>  
    <xsl:call-template name="n-format"/>
    <xsl:text>(</xsl:text><xsl:value-of select="@scope"/><xsl:text>) </xsl:text>
        <xsl:call-template name="splitlist">    
            <xsl:with-param name="list" select="@script"/>
        </xsl:call-template>
    <xsl:text> script.</xsl:text>
    <xsl:if test="@medium">
        <xsl:text> </xsl:text>
        <xsl:value-of select="@medium"/>
        <xsl:text>. </xsl:text>
    </xsl:if>
    <xsl:apply-templates/>
  </li>
</xsl:template>
<xsl:template match="x:handNote/x:p">
    <ul><li><xsl:apply-templates/></li></ul>
</xsl:template>

<xsl:template match="x:handNote/x:desc">
    <xsl:element name="ul">
        <xsl:element name="li">
            <xsl:call-template name="lang"/>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:additions">
  <tr>
    <th>Additions</th>
    <td>
      <xsl:apply-templates />
    </td>
  </tr>
</xsl:template>
<xsl:template match="x:additions/x:p">
    <p><xsl:apply-templates /></p>
</xsl:template>

<xsl:template match="x:bindingDesc">
    <tr>
        <th>Binding</th>
        <td>
            <xsl:apply-templates/>
        </td>
    </tr>
</xsl:template>

<xsl:template match="x:binding">
    <p><xsl:apply-templates/></p>
</xsl:template>
<xsl:template match="x:binding/x:p">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:history">
    <section>
    <h3>History</h3>
    <table id="history">
        <tr>
            <th>Date of production</th>
            <td><xsl:apply-templates select="x:origin/x:origDate"/></td>
        </tr>
        <tr>
            <th>Place of origin</th>
            <td><xsl:apply-templates select="x:origin/x:origPlace"/></td>
        </tr>
        <xsl:if test="x:provenance">
            <tr>
                <th>Provenance</th>
                <td><xsl:apply-templates select="x:provenance"/></td>
            </tr>
        </xsl:if>
        <xsl:if test="x:acquisition">
            <tr>
                <th>Acquisition</th>
                <td><xsl:apply-templates select="x:acquisition"/></td>
            </tr>
        </xsl:if>
    </table>
    </section>
</xsl:template>

<xsl:template match="x:listBibl">
    <h3>Bibliography</h3>
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:bibl">
    <xsl:element name="p">
        <xsl:attribute name="class">bibliography</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:emph">
    <xsl:element name="em">
        <xsl:attribute name="class">
            <xsl:value-of select="@rend"/>
        </xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:lg">
    <xsl:element name="div">
        <xsl:attribute name="class">lg</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:l">
    <xsl:element name="div">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">l</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:additional">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:encodingDesc">
    <h3>Encoding conventions</h3>
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:profileDesc"/>

<xsl:template match="x:revisionDesc">
    <section>
        <h3>Revision history</h3>
        <xsl:element name="table">
            <xsl:apply-templates/>
        </xsl:element>
    </section>
</xsl:template>

<xsl:template match="x:revisionDesc/x:change">
    <xsl:element name="tr">
        <xsl:element name="th">
            <xsl:attribute name="class">when</xsl:attribute>
            <xsl:value-of select="@when"/>
        </xsl:element>
        <xsl:element name="td">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:facsimile"/>

<xsl:template match="x:text">
    <xsl:element name="hr"/>
    <section class="teitext">
        <xsl:apply-templates/>
    </section>
</xsl:template>

<xsl:template match="x:text/x:body">
    <xsl:apply-templates/>
</xsl:template>

<xsl:template match="x:ref">
    <xsl:element name="a">
        <xsl:attribute name="href"><xsl:value-of select="@target"/></xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:p">
    <xsl:element name="p">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:material">
    <xsl:element name="span">
        <xsl:attribute name="class">material</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:persName">
    <xsl:element name="span">
        <xsl:attribute name="class">persname</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:sourceDoc"/>

<xsl:template match="@*|node()">
    <xsl:copy>
    <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
</xsl:template>

</xsl:stylesheet>
