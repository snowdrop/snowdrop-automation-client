from centos:8
#from fedora:32

LABEL name="snowdrop-automation-client"
LABEL version="latest"

ENV NVM_VERSION 8.17.0
# ENV NODE_VERSION 6.4.13
ENV NVM_INSTALL_SCRIPT_VERSION 0.35.3
ENV HOME /home/nvm
ENV NVM_DIR $HOME/.nvm

# python3 is required on centos 8 but not on fedora 32.
RUN yum install -y --allowerasing curl coreutils \
        make \
        gcc gcc-c++ kernel-devel \
        java-1.8.0-openjdk-devel \
        git                     \
        python3                 \ 
    && yum clean all && rm -rf /var/cache/yum

RUN useradd -ms /bin/bash nvm

USER nvm

WORKDIR $HOME

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v$NVM_INSTALL_SCRIPT_VERSION/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NVM_VERSION \
    && nvm alias default $NVM_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NVM_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NVM_VERSION/bin:$PATH

RUN mkdir snowdrop-automation-client

WORKDIR snowdrop-automation-client

COPY --chown=nvm . .

RUN chmod +x container-entrypoint.sh

RUN npm --cache /tmp/empty-cache install && npm run clean && npm run compile
# TODO: && npm run test

ENTRYPOINT ["./container-entrypoint.sh"]

CMD ["npm", "start"]
