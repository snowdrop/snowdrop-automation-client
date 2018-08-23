import * as assert from "power-assert";
import {calculateNewPropertyVersions} from "../../../lib/support/utils/bomUtils";

describe("calculateNewPropertyVersions", () => {

  it("should return all artifacts when no ignored properties are specified", () => {
    const results = calculateNewPropertyVersions(ReferenceBom, ExistingBom);
    assert(results.size === 4, `Got ${results.size} results`);
    assert(results.get("httpclient.version") === "4.5.6");
    assert(results.get("httpcore.version") === "4.4.10");
    assert(results.get("spring-amqp.version") === "1.7.9.RELEASE");
    assert(results.get("tomcat.version") === "8.5.32");
  });

  it("should return all artifacts when ignored properties are specified", () => {
    const results = calculateNewPropertyVersions(ReferenceBom, ExistingBom, ["httpclient.version", "tomcat.version"]);
    assert(results.size === 2, `Got ${results.size} results`);
    assert(results.get("httpcore.version") === "4.4.10");
    assert(results.get("spring-amqp.version") === "1.7.9.RELEASE");
  });

});

/* tslint:disable */

const ExistingBom = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>me.snowdrop</groupId>
	<artifactId>spring-boot-bom</artifactId>
	<version>1.5.14.Final</version>
	<packaging>pom</packaging>
	<name>Snowdrop Spring Boot BOM</name>
	<description>Spring Boot Dependencies</description>
  <url>http://www.snowdrop.me</url>
  
	
	<properties>
    <httpclient.version>4.5.5</httpclient.version>
    <httpcore.version>4.4.9</httpcore.version>
    <spring-amqp.version>1.7.8.RELEASE</spring-amqp.version>
    <spring-security.version>4.2.7.RELEASE</spring-security.version>
    <tomcat.version>8.5.31</tomcat.version>
    
    <keycloak.version>3.4.3.Final</keycloak.version>
    
    <spring-cloud-config.version>1.4.4.RELEASE</spring-cloud-config.version>    
	</properties>
	
	<dependencyManagement>
	  <dependencies> 
      <dependency>
        <groupId>org.apache.httpcomponents</groupId>
        <artifactId>httpclient</artifactId>
        <version>\${httpclient.version}</version>
        <exclusions>
          <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
          </exclusion>
        </exclusions>
      </dependency>
      <dependency>
        <groupId>org.apache.httpcomponents</groupId>
        <artifactId>httpcore</artifactId>
        <version>\${httpcore.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.httpcomponents</groupId>
        <artifactId>httpmime</artifactId>
        <version>\${httpclient.version}</version>
      </dependency>
      <dependency>
        <groupId>org.springframework.amqp</groupId>
        <artifactId>spring-amqp</artifactId>
        <version>\${spring-amqp.version}</version>
      </dependency>
      <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-crypto</artifactId>
        <version>\${spring-security.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-core</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-el</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-jasper</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-websocket</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat</groupId>
        <artifactId>tomcat-jdbc</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>      
      <dependency>
        <groupId>org.keycloak</groupId>
        <artifactId>keycloak-spring-boot-starter</artifactId>
        <version>\${keycloak.version}</version>
      </dependency>                      			                 
    </dependencies>
  </dependencyManagement>
</project>`;

const ReferenceBom = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-dependencies</artifactId>
	<version>1.5.15.RELEASE</version>
	<packaging>pom</packaging>
	<name>Spring Boot Dependencies</name>
	<description>Spring Boot Dependencies</description>
  <url>http://projects.spring.io/spring-boot/</url>
  
	
	<properties>
    <activemq.version>5.14.5</activemq.version>
    <httpclient.version>4.5.6</httpclient.version>
    <httpcore.version>4.4.10</httpcore.version>
    <spring-amqp.version>1.7.9.RELEASE</spring-amqp.version>
    <spring-hateoas.version>0.23.0.RELEASE</spring-hateoas.version>
    <tomcat.version>8.5.32</tomcat.version>
	</properties>
	
	<dependencyManagement>
	  <dependencies>
			<dependency>
				<groupId>org.apache.activemq</groupId>
				<artifactId>activemq-amqp</artifactId>
				<version>\${activemq.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.activemq</groupId>
				<artifactId>activemq-blueprint</artifactId>
				<version>\${activemq.version}</version>
			</dependency>
      <dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>fluent-hc</artifactId>
				<version>\${httpclient.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpclient</artifactId>
				<version>\${httpclient.version}</version>
				<exclusions>
					<exclusion>
						<groupId>commons-logging</groupId>
						<artifactId>commons-logging</artifactId>
					</exclusion>
				</exclusions>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpclient-cache</artifactId>
				<version>\${httpclient.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpclient-osgi</artifactId>
				<version>\${httpclient.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpclient-win</artifactId>
				<version>\${httpclient.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpcore</artifactId>
				<version>\${httpcore.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.httpcomponents</groupId>
				<artifactId>httpmime</artifactId>
				<version>\${httpclient.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat.embed</groupId>
				<artifactId>tomcat-embed-core</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat.embed</groupId>
				<artifactId>tomcat-embed-el</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat.embed</groupId>
				<artifactId>tomcat-embed-jasper</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat.embed</groupId>
				<artifactId>tomcat-embed-websocket</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat</groupId>
				<artifactId>tomcat-annotations-api</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat</groupId>
				<artifactId>tomcat-jdbc</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.tomcat</groupId>
				<artifactId>tomcat-jsp-api</artifactId>
				<version>\${tomcat.version}</version>
			</dependency>		
			<dependency>
				<groupId>org.springframework.amqp</groupId>
				<artifactId>spring-amqp</artifactId>
				<version>\${spring-amqp.version}</version>
			</dependency>
			<dependency>
				<groupId>org.springframework.amqp</groupId>
				<artifactId>spring-rabbit</artifactId>
				<version>\${spring-amqp.version}</version>
			</dependency>
			<dependency>
				<groupId>org.springframework.amqp</groupId>
				<artifactId>spring-rabbit-junit</artifactId>
				<version>\${spring-amqp.version}</version>
			</dependency>
			<dependency>
				<groupId>org.springframework.amqp</groupId>
				<artifactId>spring-rabbit-test</artifactId>
				<version>\${spring-amqp.version}</version>
			</dependency>
			<dependency>
				<groupId>org.springframework.hateoas</groupId>
				<artifactId>spring-hateoas</artifactId>
				<version>\${spring-hateoas.version}</version>
			</dependency>											                  
    </dependencies>
  </dependencyManagement>
</project>`;
